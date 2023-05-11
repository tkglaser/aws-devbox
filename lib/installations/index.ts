import { UserData, Volume } from 'aws-cdk-lib/aws-ec2';

import { createUser } from './create-user';
import { config } from '../../config/config';
import { globalToolsAndSettings } from './global-tools-and-settings';
import { nodeAndTools } from './node';
import { mountExternalVolume } from './mount-ebs-volume';
import { Role } from 'aws-cdk-lib/aws-iam';
import { IConstruct } from 'constructs';
import { copyAwsConfig } from './copy-aws-config';

export function install(userData: UserData, props: { scope: IConstruct; volume: Volume; instanceRole: Role }) {
  createUser(userData, config);
  globalToolsAndSettings(userData, config);
  mountExternalVolume(userData, props.volume, config);
  copyAwsConfig(userData, props.instanceRole, props.scope, config);
  nodeAndTools(userData, config);
}
