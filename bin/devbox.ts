import { App } from 'aws-cdk-lib';

import { DevboxStack } from '../lib/devbox-stack';
import { DevboxVpcStack } from '../lib/devbox-vpc-stack';
import { DevboxStorageStack } from '../lib/devbox-storage-stack';
import { DevboxDeploymentStack } from '../lib/devbox-deployment-stack';
import { config } from '../config/config';

const app = new App();

const env = {
  account: config.account.id,
  region: config.account.region,
};

const { vpc, vpcSubnet } = new DevboxVpcStack(app, 'DevboxVpcStack', { env });
const { volume } = new DevboxStorageStack(app, 'DevboxStorageStack', { env, vpc, vpcSubnet });
const { instanceRole } = new DevboxStack(app, 'DevboxStack', { env, vpc, vpcSubnet, volume });

for (const deploymentAccount of config.deploymentAccounts) {
  new DevboxDeploymentStack(app, `DevboxDeploymentStack${deploymentAccount.id}`, {
    instanceRole,
    deployToAccounts: deploymentAccount.deployToAccounts,
    env: { account: deploymentAccount.id, region: deploymentAccount.region },
  });
}
