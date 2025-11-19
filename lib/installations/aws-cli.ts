import { UserDataBuilder } from './utils/user-data-builder';

export function awsCli(userData: UserDataBuilder) {
  userData.cmd(
    `cd ~`,
    `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"`,
    `unzip awscliv2.zip`,
    `sudo ./aws/install`,
    `curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"`,
    `sudo dpkg -i session-manager-plugin.deb`,
  );
}
