import { runAs } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

export function globalToolsAndSettings(
  userData: UserDataBuilder,
  props: { user: string; userName: string; email: string },
) {
  userData
    .beforeAptInstall('sudo apt-get update -y', 'sudo apt-get install -y --no-install-recommends apt-utils')
    .aptInstall('locales', 'git', 'unison', 'nano', 'mc', 'build-essential', 'python3-pip')
    .cmd(
      'sudo pip3 install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz',
      'sudo mkdir -p /opt/aws/bin',
      'sudo ln -s /usr/local/bin/cfn-signal /opt/aws/bin/cfn-signal',
      `sudo locale-gen en_GB.UTF-8`,
      `sudo update-locale LANG=en_GB.UTF-8`,
      runAs(props.user, `git config --global user.name "${props.userName}"`),
      runAs(props.user, `git config --global user.email "${props.email}"`),
    );
}
