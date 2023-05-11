import { RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import { EbsDeviceVolumeType, ISubnet, Volume, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface DevboxStorageStackProps extends StackProps {
  vpc: Vpc;
  vpcSubnet: ISubnet;
}

export class DevboxStorageStack extends Stack {
  public volume: Volume;

  constructor(scope: Construct, id: string, props: DevboxStorageStackProps) {
    super(scope, id, props);

    this.volume = new Volume(this, 'DevVolume', {
      availabilityZone: props.vpcSubnet.availabilityZone,
      size: Size.gibibytes(100),
      encrypted: true,
      volumeName: 'DevVolume',
      volumeType: EbsDeviceVolumeType.GP3,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
