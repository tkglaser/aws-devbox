import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';

import { Config } from '../models/config';

/**
 * Example config, create a `config.ts` file in the current folder.
 */

export const config: Config = {
  user: 'useronbox',
  userName: 'John Doe',
  email: 'john@example.com',
  account: {
    id: '123456789012',
    profile: 'my-dev-account',
    region: 'my-region',
  },
  instance: {
    type: InstanceType.of(InstanceClass.T3, InstanceSize.XLARGE2),
    // Latest Ubuntu Minimal Server
    amiSsmParameter: '/aws/service/canonical/ubuntu/server-minimal/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id',
  },
  autoSwitchOff: Schedule.cron({ minute: '0', hour: '2' }),
  sshKey: {
    name: 'my-key-name',
    file: '/path/to/my-key-name.pem',
  },
  tools: {
    apt: ['locales', 'git', 'awscli', 'unison', 'nodejs', 'nano', 'mc', 'python3.10-venv'], // installed via apt-get install
    npm: ['pnpm', '@microsoft/rush', 'aws-cdk'], // installed via npm i -g
  },
  deploymentAccounts: [
    {
      id: '210987654321',
      profile: 'my-test-account',
      region: 'my-region',
    },
  ],
};
