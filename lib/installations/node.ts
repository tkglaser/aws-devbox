import { runAs } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

export function nodeAndTools(userData: UserDataBuilder, props: { user: string }) {
  userData
    .beforeAptInstall(`cd ~ && curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -`)
    .aptInstall('nodejs')
    .cmd(
      `sudo npm i -g pnpm @microsoft/rush aws-cdk`,
      runAs(props.user, `echo "export NODE_OPTIONS=--max-old-space-size=4096" >> ~/.bashrc`),
    );
}
