import { runAs } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

export function globalToolsAndSettings(
  userData: UserDataBuilder,
  props: {
    user: string;
    userName: string;
    email: string;
    timeZone: string;
    language: { languagePacks?: string[]; locales?: string[]; defaultLocale: string };
  },
) {
  const aptLanguagePacks = (props.language.languagePacks ?? []).map((l) => `language-pack-${l}`);
  const localeGenCommands = (props.language.locales ?? []).map((l) => `sudo locale-gen ${l}`);
  localeGenCommands.push(props.language.defaultLocale);
  userData
    .beforeAptInstall('sudo apt-get update -y', 'sudo apt-get install -y --no-install-recommends apt-utils')
    .aptInstall('locales', 'git', 'unison', 'nano', 'mc', 'build-essential', 'python3-pip', ...aptLanguagePacks)
    .cmd(
      'sudo pip3 install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz',
      'sudo mkdir -p /opt/aws/bin',
      'sudo ln -s /usr/local/bin/cfn-signal /opt/aws/bin/cfn-signal',
      ...localeGenCommands,
      `sudo update-locale LANG=${props.language.defaultLocale}`,
      `sudo timedatectl set-timezone ${props.timeZone}`,
      runAs(props.user, `echo "export UNISONLOCALHOSTNAME=devbox" >> ~/.bashrc`),
      runAs(props.user, `git config --global user.name "${props.userName}"`),
      runAs(props.user, `git config --global user.email "${props.email}"`),
      runAs(props.user, `echo "export NODE_OPTIONS=--max-old-space-size=4096" >> ~/.bashrc`),
    );
}
