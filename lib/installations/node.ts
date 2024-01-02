import { UserDataBuilder } from './utils/user-data-builder';

export function nodeAndTools(
  userData: UserDataBuilder,
  props: { user: string; features: { node?: { version: string } } },
) {
  userData
    .beforeAptInstall(
      `cd ~ && curl -fsSL https://deb.nodesource.com/setup_${props.features.node!.version}.x | sudo -E bash -`,
    )
    .aptInstall('nodejs')
    .cmd(
      `sudo corepack enable`,
      `sudo corepack prepare pnpm@8.6.3 --activate`,
      `sudo npm i -g @microsoft/rush aws-cdk`,
    );
}
