import { Volume } from 'aws-cdk-lib/aws-ec2';

import { IRole } from 'aws-cdk-lib/aws-iam';
import { IConstruct } from 'constructs';
import { config } from '../../config/config';
import { awsCli } from './aws-cli';
import { copyAwsConfig } from './copy-aws-config';
import { createUser } from './create-user';
import { docker } from './docker';
import { globalToolsAndSettings } from './global-tools-and-settings';
import { java } from './java';
import { maven } from './maven';
import { mountExternalVolume } from './mount-ebs-volume';
import { nodeAndTools } from './node';
import { UserDataBuilder } from './utils/user-data-builder';
import { vsCodeServer } from './vscode-server';
import { dotnet } from './dotnet';

export function createUserData(props: { scope: IConstruct; volume: Volume; instanceRole: IRole }) {
  const userData = new UserDataBuilder();

  createUser(userData, config);
  globalToolsAndSettings(userData, config);
  awsCli(userData);
  mountExternalVolume(userData, props.volume, config);
  copyAwsConfig(userData, config);

  if (config.features.node?.install) {
    nodeAndTools(userData, config);
  }

  if (config.features.vsCodeServer?.install) {
    vsCodeServer(userData, config);
  }

  if (config.features.docker?.install) {
    docker(userData, config);
  }

  if (config.features.java?.install) {
    java(userData, config);
  }

  if (config.features.maven?.install) {
    maven(userData, config);
  }

  if (config.features.dotnet?.install) {
    dotnet(userData, config);
  }

  return userData.render(props.scope, props.instanceRole);
}
