import { $, runAs } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

const version = `3.9.6`;

export function maven(userData: UserDataBuilder, props: { user: string }) {
  userData.cmd(
    `wget https://dlcdn.apache.org/maven/maven-3/${version}/binaries/apache-maven-${version}-bin.tar.gz -O /tmp/apache-maven-${version}.tar.gz`,
    `cd /tmp`,
    `tar -xvf apache-maven-${version}.tar.gz`,
    `mv apache-maven-${version} /opt/`,
    runAs(props.user, `echo "export M2_HOME=/opt/apache-maven-${version}" >> ~/.bashrc`),
    runAs(props.user, `echo "PATH=${$('M2_HOME')}/bin:${$('PATH')}" >> ~/.bashrc`),
  );
}
