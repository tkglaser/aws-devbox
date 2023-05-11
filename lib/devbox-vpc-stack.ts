import { Stack, StackProps } from 'aws-cdk-lib';
import { ISubnet, IpAddresses, SubnetConfiguration, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { config } from '../config/config';
import { NetworkingMode } from '../models/config';

export class DevboxVpcStack extends Stack {
  public vpc: Vpc;
  public vpcSubnet: ISubnet;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const subnetConfiguration: SubnetConfiguration[] = [
      {
        cidrMask: 17,
        name: 'public',
        subnetType: SubnetType.PUBLIC,
      },
    ];

    if (config.networkingMode === NetworkingMode.AWS_SSM) {
      subnetConfiguration.push({
        cidrMask: 17,
        name: 'private',
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      });
    }

    this.vpc = new Vpc(this, 'DevBoxVpc', {
      maxAzs: 1,
      subnetConfiguration,
    });

    if (config.networkingMode === NetworkingMode.AWS_SSM) {
      this.vpcSubnet = this.vpc.privateSubnets[0];
    } else {
      this.vpcSubnet = this.vpc.publicSubnets[0];
    }
  }
}
