import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';

import { Config } from '../models/config';

/**
 * Example config, create a `config.ts` file in the current folder.
 */

export const config: Config = {
  user: 'useronbox',
  userName: 'John Doe',
  email: 'john@example.com',
  timeZone: 'Europe/London',
  language: {
    defaultLocale: 'en_GB.UTF-8',
  },
  account: {
    id: '123456789012',
    profile: 'my-dev-account',
    region: 'my-region',
  },
  instance: {
    type: InstanceType.of(InstanceClass.T3, InstanceSize.XLARGE2),
    // Latest Ubuntu Minimal Server
    amiSsmParameter: '/aws/service/canonical/ubuntu/server-minimal/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id',
  },
  autoSwitch: {
    off: Schedule.cron({ minute: '0', hour: '2' }),
  },
  sshKey: {
    name: 'my-key-name',
    file: '/path/to/my-key-name.pem',
  },
  deploymentAccounts: [
    {
      id: '210987654321',
      profile: 'my-test-account',
      region: 'my-region',
      accessRole: {
        managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')],
      },
    },
  ],

  features: {
    docker: { install: true },
    node: { install: true, },
  },
};
