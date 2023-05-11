import { RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import { EbsDeviceVolumeType, ISubnet, SubnetType, Volume, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import * as path from 'path';

export interface DevboxStorageStackProps extends StackProps {
  vpc: Vpc;
  vpcSubnet: ISubnet;
}

export class DevboxStorageStack extends Stack {
  public volume: Volume;
  public awsConfig: Asset;

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

    this.awsConfig = new Asset(this, 'AwsConfig', {
      path: path.join(__dirname, '../assets/aws.config'),
    });
  }
}
