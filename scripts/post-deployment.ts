import { waitUntilInstanceStatusOk } from '@aws-sdk/client-ec2';
import * as dotenv from 'dotenv';
import * as os from 'os';
import * as path from 'path';

import { config } from '../config/config';
import { env } from '../lib/env';
import { NetworkingMode } from '../models/config';
import { ec2Client } from '../util/client';
import { JsonFile } from '../util/json-file';
import { runCommand } from '../util/run-command';
import { TextFile } from '../util/text-file';

async function main() {
  saveInstanceIdToEnv();
  await startInstance();
  updateSshConfig();
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

  if (config.networkingMode === NetworkingMode.PUBLIC_IP) {
    const describeResult = await ec2.describeInstances(params);

    const publicIp = describeResult.Reservations![0].Instances![0].PublicIpAddress!;
    if (typeof publicIp === 'undefined') {
      throw new Error('Unable to determine IP!');
    }

    saveValueToEnv('DEVBOX_IP', publicIp);
  }
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

function updateSshConfig() {
  const markers = {
    start: '### Start of DEVBOX config block',
    notice: [
      '################################################################################################',
      '### ****                             IMPORTANT NOTICE                                   **** ###',
      '### ****    Any custom config inside of the DEVBOX config block will be overridden!     **** ###',
      '################################################################################################',
    ],
    end: '### End of DEVBOX config block',
  };
  const sshConfig = new TextFile(os.homedir(), '.ssh/config');

  const devboxConfig: string[] = [];
  if (config.networkingMode === NetworkingMode.AWS_SSM) {
    devboxConfig.push(
      'Host devbox',
      `  HostName ${env().instanceId}`,
      `  ProxyCommand sh -c "aws --profile ${config.account.profile} ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"`,
    );
  } else {
    devboxConfig.push('Host devbox', `  HostName ${env().instanceIp}`);
  }

  const restOfConfig: string[] = [];
  let insideConfig = false;
  for (const line of sshConfig.content) {
    if (line === markers.start) {
      insideConfig = true;
    } else if (line === markers.end) {
      insideConfig = false;
    } else if (!insideConfig) {
      restOfConfig.push(line);
    }
  }

  sshConfig.content = [markers.start, '', ...markers.notice, '', ...devboxConfig, '', markers.end, ...restOfConfig];
}

function saveValueToEnv(name: string, value: string) {
  const envFile = new TextFile(__dirname, '../.env');
  const env = dotenv.parse(envFile.content.join('\n'));

  env[name] = value;

  envFile.content = Object.entries(env).map(([key, value]) => `${key}=${value}`);
  dotenv.config({ path: path.join(__dirname, '../.env'), override: true });
}
