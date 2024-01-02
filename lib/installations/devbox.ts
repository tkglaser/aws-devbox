import { chown, runAs } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

const installScript = `/tmp/dbi.sh`;
const bashComp = `/tmp/dbc`;

export function devbox(userData: UserDataBuilder, props: { user: string }) {
  userData.cmd(
    `curl -fsSL https://get.jetpack.io/devbox > ${installScript}`,
    chown(props.user, installScript),
    `chmod +x ${installScript}`,
    runAs(props.user, `${installScript} -f`),
    runAs(props.user, `devbox completion bash > ${bashComp}`),
    `mv ${bashComp} /etc/bash_completion.d/devbox`,
    chown('root', '/etc/bash_completion.d/devbox'),
  );
}
