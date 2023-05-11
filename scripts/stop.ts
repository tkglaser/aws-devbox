import { waitUntilInstanceStopped } from '@aws-sdk/client-ec2';

import { env } from '../lib/env';
import { ec2Client } from '../util/client';

async function main() {
  const ec2 = ec2Client();

  const params = {
    InstanceIds: [env().instanceId],
  };

  console.log('Stopping instance...');
  await ec2.stopInstances(params);

  await waitUntilInstanceStopped({ client: ec2, maxWaitTime: 10 * 60 }, params);
  console.log('Instance has stopped');
}

main();
