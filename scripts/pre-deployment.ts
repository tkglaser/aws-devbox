import { config } from '../config/config';
import { AuthenticationType } from '../models/config';
import { deploymentRoleName } from '../util/names';
import { TextFile } from '../util/text-file';

async function main() {
  renderAwsConfig();
}

main();

function renderAwsConfig() {
  console.log('Rendering AWS config...');
  const awsConfig: string[] = [];
  const awsCredentials: string[] = [];
  for (const deploymentAccount of config.deploymentAccounts) {
    if (deploymentAccount.authentication.type === AuthenticationType.INSTANCE_METADATA_ROLE) {
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
    } else if (deploymentAccount.authentication.type === AuthenticationType.CREDENTIAL_FILE) {
      awsConfig.push(
        `[profile ${deploymentAccount.profile}]`,
        `output = json`,
        `region = ${deploymentAccount.region}`,
        ``,
      );
      awsCredentials.push(
        `[${deploymentAccount.profile}]`,
        `aws_access_key_id = ${deploymentAccount.authentication.accessKeyId}`,
        `aws_secret_access_key = ${deploymentAccount.authentication.secretAccessKey}`,
        ``,
      );
    }
  }

  TextFile.at(__dirname, '../assets/aws.config').write(awsConfig);
  TextFile.at(__dirname, '../assets/aws.credentials').write(awsCredentials);
  console.log('Rendering AWS config done.');
}
