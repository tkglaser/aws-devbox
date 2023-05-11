import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import {
  BlockDeviceVolume,
  EbsDeviceVolumeType,
  ISubnet,
  Instance,
  MachineImage,
  OperatingSystemType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Volume,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { IRole, ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';

import { config } from '../config/config';
import { DevboxUserData } from '../util/devbox-userdata';
import { SwitchOffLambda } from './constructs/switch-off/switch-off.lambda';
import { NetworkingMode } from '../models/config';

export interface DevboxStackProps extends StackProps {
  vpc: Vpc;
  vpcSubnet: ISubnet;
  volume: Volume;
  awsConfig: Asset;
}

export class DevboxStack extends Stack {
  public readonly instanceRole: IRole;

  constructor(scope: Construct, id: string, props: DevboxStackProps) {
    super(scope, id, props);

    const instanceRole = new Role(this, 'InstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
    });

    const userData = new DevboxUserData({ user: config.user });

    userData.installGlobalTools({ userName: config.userName, email: config.email });
    userData.createUser();
    userData.copyKeys({ fromUser: config.instance.defaultUser ?? 'ubuntu' });
    userData.mountExternalVolume({
      targetDevice: '/dev/sdf',
      internalDevice: '/dev/nvme1n1', // EBS optimised is mounted as NVMe
      volume: props.volume,
      path: config.instance.volumeMountTarget ?? `/home/${config.user}/projects`,
      region: Stack.of(this).region,
    });

    userData.copyAwsConfig({ from: props.awsConfig, readerRole: instanceRole });

    const machineImage = MachineImage.fromSsmParameter(config.instance.amiSsmParameter, {
      os: OperatingSystemType.LINUX,
      userData: userData.data,
    });

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      description: 'DevBox SG',
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    if (config.networkingMode === NetworkingMode.PUBLIC_IP) {
      const publicIp = this.node.getContext('currentPublicIp');
      securityGroup.addIngressRule(Peer.ipv4(`${publicIp}/32`), Port.tcp(22));
    }

    const inst = new Instance(this, 'DevBox', {
      vpc: props.vpc,
      vpcSubnets: { subnets: [props.vpcSubnet] },
      securityGroup,
      instanceType: config.instance.type,
      machineImage,
      keyName: config.sshKey.name,
      role: instanceRole,
      userDataCausesReplacement: true,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          mappingEnabled: true,
          volume: BlockDeviceVolume.ebs(8, {
            deleteOnTermination: true,
            volumeType: EbsDeviceVolumeType.GP2,
            encrypted: true,
          }),
        },
      ],
    });

    userData.data.addSignalOnExitCommand(inst);

    props.volume.grantAttachVolumeByResourceTag(inst.grantPrincipal, [inst]);

    inst.node.addDependency(instanceRole);

    this.instanceRole = inst.role;

    if (config.autoSwitchOff) {
      const switchOffLambda = new SwitchOffLambda(this, 'SwitchOff', { instanceId: inst.instanceId });
      const cron = new Rule(this, 'SwitchOffRule', { schedule: config.autoSwitchOff });
      cron.addTarget(new LambdaFunction(switchOffLambda));
    }

    new CfnOutput(this, 'ID', {
      value: inst.instanceId,
    });
  }
}
