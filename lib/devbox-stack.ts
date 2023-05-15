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
  UserData,
  Volume,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { IRole, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { config } from '../config/config';
import { NetworkingMode } from '../models/config';
import { SwitchOffLambda } from './constructs/switch-off/switch-off.lambda';
import { createUserData } from './installations';

export interface DevboxStackProps extends StackProps {
  vpc: Vpc;
  vpcSubnet: ISubnet;
  volume: Volume;
}

export class DevboxStack extends Stack {
  public readonly instanceRole: IRole;

  constructor(scope: Construct, id: string, props: DevboxStackProps) {
    super(scope, id, props);

    const instanceRole = new Role(this, 'InstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
    });

    instanceRole.addToPolicy(
      new PolicyStatement({
        actions: [
          'codeartifact:GetAuthorizationToken',
          'codeartifact:GetRepositoryEndpoint',
          'codeartifact:ReadFromRepository',
          'sts:GetServiceBearerToken',
        ],
        resources: ['*'], // log in to external CA repos
      }),
    );

    const userData = createUserData({ scope: this, volume: props.volume, instanceRole });

    const machineImage = MachineImage.fromSsmParameter(config.instance.amiSsmParameter, {
      os: OperatingSystemType.LINUX,
      userData: userData,
    });

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      description: 'devbox security group',
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    if (config.networkingMode === NetworkingMode.PUBLIC_IP) {
      const publicIp = this.node.getContext('currentPublicIp');
      securityGroup.addIngressRule(Peer.ipv4(`${publicIp}/32`), Port.tcp(22));
    }

    const inst = new Instance(this, 'DevBox', {
      instanceName: 'devbox',
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

    userData.addSignalOnExitCommand(inst);

    props.volume.grantAttachVolumeByResourceTag(inst.grantPrincipal, [inst]);

    inst.node.addDependency(instanceRole);
    inst.node.addDependency(props.volume);

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
