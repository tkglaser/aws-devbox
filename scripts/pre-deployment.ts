import * as superagent from 'superagent';

import { config } from '../config/config';
import { JsonFile } from '../util/json-file';
import { TextFile } from '../util/text-file';
import { NetworkingMode } from '../models/config';
import { deploymentRoleName } from '../util/names';

function main() {
  renderAwsConfig();
  if (config.networkingMode === NetworkingMode.PUBLIC_IP) {
    getIpAndSaveToContext();
  }
}

main();

function getIpAndSaveToContext() {
  console.log('Checking public IP...');
  superagent.get('api.ipify.org/?format=json').end((err, res) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`Public IP is ${res.body.ip}`);

    const cdkContext = new JsonFile<{ currentPublicIp: string }>(__dirname, '../cdk.context.json');
    cdkContext.content = {
      ...cdkContext.content,
      currentPublicIp: res.body.ip,
    };
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
      `role_arn = arn:aws:iam::${deploymentAccount.id}:role/${deploymentRoleName(config.user, config.account.id)}`,
      `credential_source = Ec2InstanceMetadata`,
      ``,
    );
  }

  const awsConfigFile = new TextFile(__dirname, '../assets/aws.config');
  awsConfigFile.content = awsConfig;
  console.log('Rendering AWS config done.');
}
