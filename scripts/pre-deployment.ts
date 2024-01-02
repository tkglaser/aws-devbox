import * as superagent from 'superagent';

import { config } from '../config/config';
import { JsonFile } from '../util/json-file';
import { TextFile } from '../util/text-file';
import { NetworkingMode } from '../models/config';
import { deploymentRoleName } from '../util/names';

async function main() {
  renderAwsConfig();
  if (config.networkingMode === NetworkingMode.PUBLIC_IP) {
    await getIpAndSaveToContext();
  }
}

main();

async function getIpAndSaveToContext() {
  const currentPublicIp = await getIpOrExit();
  const cdkContext = new JsonFile<{ currentPublicIp: string }>(__dirname, '../cdk.context.json');
  cdkContext.content = { ...cdkContext.content, currentPublicIp };
}

async function getIpOrExit() {
  console.log('Checking public IP...');

  console.log('Trying ipify...');
  try {
    const res = await getUrl<{ ip: string }>('api.ipify.org/?format=json');
    return res.ip;
  } catch {}

  console.log('Trying bigdatacloud...');
  try {
    const res = await getUrl<{ ipString: string }>('https://api.bigdatacloud.net/data/client-ip');
    return res.ipString;
  } catch {}

  console.error('Unable to get IP');
  process.exit(1);
}

function getUrl<T>(url: string) {
  // We're not waiting longer than 2 seconds!
  return new Promise<T>((resolve, reject) => {
    const handle = setTimeout(() => {
      reject('timed out');
    }, 2000);

    superagent.get(url).end((err, res) => {
      clearTimeout(handle);
      if (err) {
        reject(err);
      } else {
        resolve(res.body);
      }
    });
  });
}

function renderAwsConfig() {
  console.log('Rendering AWS config...');
  const awsConfig: string[] = [];
  for (const deploymentAccount of config.deploymentAccounts) {
    awsConfig.push(
      `[profile ${deploymentAccount.profile}]`,
      `output = json`,
      `region = ${deploymentAccount.region}`,
      `role_arn = arn:aws:iam::${deploymentAccount.id}:role/${deploymentRoleName(
        config.user,
        config.account.id,
        config.account.region,
      )}`,
      `credential_source = Ec2InstanceMetadata`,
      ``,
    );
  }

  const awsConfigFile = new TextFile(__dirname, '../assets/aws.config');
  awsConfigFile.content = awsConfig;
  console.log('Rendering AWS config done.');
}
