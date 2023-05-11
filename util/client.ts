import { EC2 } from '@aws-sdk/client-ec2';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

import { config } from '../config/config';

export function ec2Client() {
  return new EC2({
    region: config.account.region,
    credentials: defaultProvider({
      profile: config.account.profile,
    }),
  });
}
