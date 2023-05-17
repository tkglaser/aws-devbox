import { env } from '../lib/env';
import { ec2Client } from '../util/client';

async function main() {
  const ec2 = ec2Client();

  const params = {
    InstanceIds: [env().instanceId],
  };

  console.log('Stopping instance...');
  await ec2.stopInstances(params);
  console.log('Instance is stopping');
}

main();
