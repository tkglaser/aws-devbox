import { Stack, StackProps } from 'aws-cdk-lib';
import { ISecurityGroup, ISubnet, SecurityGroup, SubnetConfiguration, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { IRole, ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { config } from '../config/config';

export class DevboxVpcStack extends Stack {
  public vpc: Vpc;
  public vpcSubnet: ISubnet;
  public securityGroup: ISecurityGroup;
  public instanceRole: IRole;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const subnetConfiguration: SubnetConfiguration[] = [
      {
        cidrMask: 17,
        name: 'public',
        subnetType: SubnetType.PUBLIC,
      },
    ];

    subnetConfiguration.push({
      cidrMask: 17,
      name: 'private',
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    });

    this.vpc = new Vpc(this, 'DevBoxVpc', {
      maxAzs: 1,
      subnetConfiguration,
    });

    this.securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      description: 'devbox security group',
      vpc: this.vpc,
      allowAllOutbound: true,
    });

    if (config.needsPublicIp) {
      this.vpcSubnet = this.vpc.publicSubnets[0];
    } else {
      this.vpcSubnet = this.vpc.privateSubnets[0];
    }

    for (const { peer, port, description } of config.securityGroupRules?.inbound ?? []) {
      this.securityGroup.addIngressRule(peer, port, description);
    }

    for (const { peer, port, description } of config.securityGroupRules?.outbound ?? []) {
      this.securityGroup.addEgressRule(peer, port, description);
    }

    const instanceRole = new Role(this, 'InstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
    });

    this.instanceRole = instanceRole;
  }
}
