import { waitUntilInstanceStatusOk } from '@aws-sdk/client-ec2';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { config } from '../config/config';
import { env } from '../lib/env';
import { ec2Client } from '../util/client';
import { JsonFile } from '../util/json-file';
import { runCommand } from '../util/run-command';

async function main() {
  saveInstanceIdToEnv();
  await startInstance();
  await resetSshKey();
}

main();

function saveInstanceIdToEnv() {
  const cdkOut = new JsonFile<{ DevboxStack: { ID: string } }>(__dirname, '../cdk.out.json');
  saveValueToEnv('DEVBOX_INSTANCE_ID', cdkOut.content.DevboxStack.ID);
}

async function startInstance() {
  const ec2 = ec2Client();

  const params = {
    InstanceIds: [env().instanceId],
  };

  console.log('Starting instance...');
  await ec2.startInstances(params);

  console.log('Waiting for instance checks...');
  await waitUntilInstanceStatusOk({ client: ec2, maxWaitTime: 10 * 60 }, params);

  console.log('Instance is running');

  const describeResult = await ec2.describeInstances(params);

  saveValueToEnv('DEVBOX_IP', describeResult.Reservations![0].Instances![0].PublicIpAddress!);
}

async function resetSshKey() {
  await runCommand({
    command: 'ssh-keygen',
    args: ['-f', path.join(os.homedir(), '.ssh/known_hosts'), '-R', 'devbox'],
    successCodes: [0, 255],
  });
  await runCommand({
    command: 'ssh-add',
    args: [config.sshKey.file],
  });
}

function saveValueToEnv(name: string, value: string) {
  const envFileName = path.join(__dirname, '../.env');
  const env = dotenv.parse(fs.readFileSync(envFileName));

  env[name] = value;

  const stringifiedEnv = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envFileName, stringifiedEnv);
  dotenv.config();
}
