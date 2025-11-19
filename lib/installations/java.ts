import { $, runAs } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

export function java(userData: UserDataBuilder, props: { user: string; features: { java?: { package: string } } }) {
  userData
    .aptInstall(props.features.java!.package)
    .cmd(
      runAs(props.user, `echo "export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))" >> ~/.bashrc`),
      runAs(props.user, `echo "PATH=${$('PATH')}:${$('JAVA_HOME')}/bin" >> ~/.bashrc`),
    );
}
