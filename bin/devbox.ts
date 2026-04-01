import { App } from 'aws-cdk-lib';

import { RoleProps } from 'aws-cdk-lib/aws-iam';
import { config } from '../config/config';
import { DevboxDeploymentStack } from '../lib/devbox-deployment-stack';
import { DevboxStack } from '../lib/devbox-stack';
import { DevboxStorageStack } from '../lib/devbox-storage-stack';
import { DevboxVpcStack } from '../lib/devbox-vpc-stack';
import { AuthenticationType, InstanceMetadataRoleAuthentication } from '../models/config';

const app = new App();

const env = {
  account: config.account.id,
  region: config.account.region,
};

const { vpc, vpcSubnet, securityGroup, instanceRole } = new DevboxVpcStack(app, 'DevboxVpcStack', { env });
const { volume } = new DevboxStorageStack(app, 'DevboxStorageStack', { env, vpc, vpcSubnet });
new DevboxStack(app, 'DevboxStack', {
  env,
  vpc,
  vpcSubnet,
  volume,
  securityGroup,
  instanceRole,
});

const groupedDeploymentAccounts: Record<string, {
  accessRole: Omit<RoleProps, 'roleName' | 'assumedBy'>;
  profile: string;
  region: string;
}[]> = {};

for (const deploymentAccount of config.deploymentAccounts.filter(acc => acc.authentication.type === AuthenticationType.INSTANCE_METADATA_ROLE)) {
  if (!groupedDeploymentAccounts[deploymentAccount.id]) {
    groupedDeploymentAccounts[deploymentAccount.id] = [];
  }
  groupedDeploymentAccounts[deploymentAccount.id].push({
    profile: deploymentAccount.profile,
    accessRole: (deploymentAccount.authentication as InstanceMetadataRoleAuthentication).accessRole,
    region: deploymentAccount.region
  });
}

for (const account of Object.keys(groupedDeploymentAccounts)) {
  new DevboxDeploymentStack(app, `DevboxDeploymentStack${account}`, {
    instanceRole,
    access: groupedDeploymentAccounts[account],
    env: { account, region: groupedDeploymentAccounts[account][0].region },
  });
}
