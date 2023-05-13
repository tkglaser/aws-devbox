import { UserData, Volume } from 'aws-cdk-lib/aws-ec2';

import { createUser } from './create-user';
import { config } from '../../config/config';
import { globalToolsAndSettings } from './global-tools-and-settings';
import { nodeAndTools } from './node';
import { mountExternalVolume } from './mount-ebs-volume';
import { Role } from 'aws-cdk-lib/aws-iam';
import { IConstruct } from 'constructs';
import { copyAwsConfig } from './copy-aws-config';
import { vsCodeServer } from './vscode-server';
import { docker } from './docker';
import { UserDataBuilder } from './utils/user-data-builder';

export function createUserData(props: { scope: IConstruct; volume: Volume; instanceRole: Role }) {
  const userData = new UserDataBuilder();

  createUser(userData, config);
  globalToolsAndSettings(userData, config);
  mountExternalVolume(userData, props.volume, config);
  copyAwsConfig(userData, config);
  nodeAndTools(userData, config);
  vsCodeServer(userData, config);
  docker(userData, config);

  return userData.render(props.scope, props.instanceRole);
}
