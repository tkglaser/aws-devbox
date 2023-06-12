import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { AccountPrincipal, IRole, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { IConstruct } from 'constructs';

import { config } from '../config/config';
import { deploymentRoleName } from '../util/names';

export interface DevboxDeploymentStackProps extends StackProps {
  instanceRole: IRole;
  deploymentAccountPolicies?: {
    [name: string]: PolicyDocument;
  };
}

export class DevboxDeploymentStack extends Stack {
  constructor(scope: IConstruct, id: string, props: DevboxDeploymentStackProps) {
    super(scope, id, props);

    const deploymentRole = new Role(this, 'DeploymentRole', {
      roleName: deploymentRoleName(config.user, config.account.id),
      assumedBy: new AccountPrincipal(Stack.of(props.instanceRole).account),
      inlinePolicies: props.deploymentAccountPolicies ?? {},
    });

    deploymentRole.grantAssumeRole(props.instanceRole);

    new CfnOutput(this, 'DeploymentRoleARN', {
      value: deploymentRole.roleArn,
    });
  }
}
