import { chown, runAs } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

const installScript = `/tmp/nvminst.sh`;

export function nodeAndTools(
  userData: UserDataBuilder,
  props: { user: string; },
) {
  userData.cmd(
    `cd ~`,
    `curl "https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh" -o "${installScript}"`,
    chown(props.user, installScript),
    `chmod +x ${installScript}`,
    runAs(props.user, installScript),
  );
}
