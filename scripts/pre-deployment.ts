import { config } from '../config/config';
import { deploymentRoleName } from '../util/names';
import { TextFile } from '../util/text-file';

async function main() {
  renderAwsConfig();
}

main();

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
        deploymentAccount.profile,
      )}`,
      `credential_source = Ec2InstanceMetadata`,
      ``,
    );
  }

  const awsConfigFile = new TextFile(__dirname, '../assets/aws.config');
  awsConfigFile.content = awsConfig;
  console.log('Rendering AWS config done.');
}
