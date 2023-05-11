import { Stack, StackProps } from 'aws-cdk-lib';
import { ISubnet, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class DevboxVpcStack extends Stack {
  public vpc: Vpc;
  public vpcSubnet: ISubnet;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'DevBoxVpc', {
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 17,
          name: 'devbox',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    this.vpcSubnet = this.vpc.publicSubnets[0]; // deploy to public subnet for accessibility
  }
}
