import { UserData } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { IConstruct } from 'constructs';
import * as path from 'path';

import { chown, runAs } from './utils/ubuntu-commands';

const version = '1.78.1';

const configDir = '.openvscode-server';

export function vsCodeServer(userData: UserData, instanceRole: Role, scope: IConstruct, props: { user: string }) {
  userData.addCommands(
    runAs(
      props.user,
      `wget https://github.com/gitpod-io/openvscode-server/releases/download/openvscode-server-v${version}/openvscode-server-v${version}-linux-x64.tar.gz -O code-server.tar.gz`,
    ),
    runAs(props.user, `tar -xzf code-server.tar.gz`),
    runAs(props.user, `rm code-server.tar.gz`),

    `cat <<EOT >> /etc/systemd/system/vscode-server.service`,
    `[Unit]`,
    `Description=VSCode Server`,
    `DefaultDependencies=no`,
    `After=network.target`,

    `[Service]`,
    `Type=simple`,
    `User=${props.user}`,
    `ExecStart=/home/${props.user}/openvscode-server-v${version}-linux-x64/bin/openvscode-server --without-connection-token`,
    `TimeoutStartSec=0`,
    `RemainAfterExit=yes`,
    ``,
    `[Install]`,
    `WantedBy=default.target`,
    `EOT`,
    ``,

    `systemctl daemon-reload`,
    `systemctl enable vscode-server.service`,
    `systemctl restart vscode-server.service`,

    runAs(props.user, `mkdir -p ~/${configDir}/extensions`),
    runAs(props.user, `touch ~/${configDir}/extensions/extensions.json`),
  );

  const settingsJson = new Asset(scope, 'VSCSettings', { path: path.join(__dirname, 'vscode-server/settings.json') });
  settingsJson.grantRead(instanceRole);
  userData.addS3DownloadCommand({
    bucket: settingsJson.bucket,
    bucketKey: settingsJson.s3ObjectKey,
    localFile: `/home/${props.user}/${configDir}/data/Machine/settings.json`,
  });

  const installExtensions = new Asset(scope, 'VSCExtensions', {
    path: path.join(__dirname, 'vscode-server/install-extensions.sh'),
  });
  installExtensions.grantRead(instanceRole);
  userData.addS3DownloadCommand({
    bucket: installExtensions.bucket,
    bucketKey: installExtensions.s3ObjectKey,
    localFile: `/home/${props.user}/${configDir}/install-extensions.sh`,
  });

  userData.addCommands(chown(props.user, `/home/${props.user}/${configDir}/`));
}
