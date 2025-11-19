import { Stack, StackProps } from 'aws-cdk-lib';
import { AccountPrincipal, IRole, Role, RoleProps } from 'aws-cdk-lib/aws-iam';
import { IConstruct } from 'constructs';

import { config } from '../config/config';
import { deploymentRoleName } from '../util/names';

interface Access {
  accessRole: Omit<RoleProps, 'roleName' | 'assumedBy'>;
  profile: string;
}

export interface DevboxDeploymentStackProps extends StackProps {
  instanceRole: IRole;
  access: Access[];
}

export class DevboxDeploymentStack extends Stack {
  constructor(scope: IConstruct, id: string, props: DevboxDeploymentStackProps) {
    super(scope, id, props);

    let i = 0;

    for (const { accessRole, profile } of props.access) {
      const deploymentRole = new Role(this, `DeploymentRole${++i}`, {
        roleName: deploymentRoleName(config.user, profile),
        assumedBy: new AccountPrincipal(Stack.of(props.instanceRole).account),
        ...accessRole,
      });

      deploymentRole.grantAssumeRole(props.instanceRole);
    }
  }
}
