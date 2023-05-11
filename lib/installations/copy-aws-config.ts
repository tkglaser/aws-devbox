import { UserData } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { IConstruct } from 'constructs';
import * as path from 'path';

export function copyAwsConfig(
  userData: UserData,
  instanceRole: Role,
  scope: IConstruct,
  props: {
    user: string;
  },
) {
  const asset = new Asset(scope, 'AwsConfig', {
    path: path.join(__dirname, '../../assets/aws.config'),
  });
  asset.grantRead(instanceRole);
  userData.addS3DownloadCommand({
    bucket: asset.bucket,
    bucketKey: asset.s3ObjectKey,
    localFile: `/home/${props.user}/.aws/config`,
  });
  userData.addCommands(`sudo chown -R ${props.user}:${props.user} /home/${props.user}/.aws`);
}
