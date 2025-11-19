import { App } from 'aws-cdk-lib';

import { config } from '../config/config';
import { DevboxDeploymentStack } from '../lib/devbox-deployment-stack';
import { DevboxStack } from '../lib/devbox-stack';
import { DevboxStorageStack } from '../lib/devbox-storage-stack';
import { DevboxVpcStack } from '../lib/devbox-vpc-stack';
import { Account } from '../models/config';

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

const groupedDeploymentAccounts: Record<string, Account[]> = {};

for (const deploymentAccount of config.deploymentAccounts) {
  if (!groupedDeploymentAccounts[deploymentAccount.id]) {
    groupedDeploymentAccounts[deploymentAccount.id] = [];
  }
  groupedDeploymentAccounts[deploymentAccount.id].push(deploymentAccount);
}

for (const account of Object.keys(groupedDeploymentAccounts)) {
  new DevboxDeploymentStack(app, `DevboxDeploymentStack${account}`, {
    instanceRole,
    access: groupedDeploymentAccounts[account],
    env: { account, region: groupedDeploymentAccounts[account][0].region },
  });
}
