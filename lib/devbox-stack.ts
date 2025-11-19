import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import {
  BlockDeviceVolume,
  EbsDeviceVolumeType,
  ISecurityGroup,
  ISubnet,
  Instance,
  KeyPair,
  MachineImage,
  OperatingSystemType,
  Volume,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { config } from '../config/config';
import { StartStopSchedule } from './constructs/start-stop-schedule';
import { createUserData } from './installations';

export interface DevboxStackProps extends StackProps {
  vpc: Vpc;
  vpcSubnet: ISubnet;
  volume: Volume;
  securityGroup: ISecurityGroup;
  instanceRole: IRole;
}

export class DevboxStack extends Stack {
  constructor(scope: Construct, id: string, props: DevboxStackProps) {
    super(scope, id, props);

    const userData = createUserData({ scope: this, volume: props.volume, instanceRole: props.instanceRole });

    const machineImage = MachineImage.fromSsmParameter(config.instance.amiSsmParameter, {
      os: OperatingSystemType.LINUX,
      userData: userData,
    });

    const keyPair = KeyPair.fromKeyPairName(this, 'KeyPair', config.sshKey.name);

    const inst = new Instance(this, 'DevBox', {
      instanceName: 'devbox',
      vpc: props.vpc,
      vpcSubnets: { subnets: [props.vpcSubnet] },
      securityGroup: props.securityGroup,
      instanceType: config.instance.type,
      machineImage,
      keyPair,
      role: props.instanceRole,
      userDataCausesReplacement: true,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          mappingEnabled: true,
          volume: BlockDeviceVolume.ebs(100, {
            deleteOnTermination: true,
            volumeType: EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });

    userData.addSignalOnExitCommand(inst);

    props.volume.grantAttachVolumeByResourceTag(inst.grantPrincipal, [inst]);

    inst.node.addDependency(props.instanceRole);
    inst.node.addDependency(props.volume);

    if (config.autoSwitch) {
      new StartStopSchedule(this, 'StartStopSchedule', {
        instanceId: inst.instanceId,
        timeZone: config.timeZone,
        start: config.autoSwitch.on,
        stop: config.autoSwitch.off,
      });
    }

    new CfnOutput(this, 'InstanceId', {
      value: inst.instanceId,
    });
  }
}
