import { UserDataBuilder } from './utils/user-data-builder';

export function awsCli(userData: UserDataBuilder) {
  userData.cmd(
    `cd ~`,
    `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"`,
    `unzip awscliv2.zip`,
    `sudo ./aws/install`,
  );
}
