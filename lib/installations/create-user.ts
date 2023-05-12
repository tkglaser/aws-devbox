import { UserData } from 'aws-cdk-lib/aws-ec2';

import { chown } from './utils/ubuntu-commands';

export function createUser(userData: UserData, props: { user: string; instance: { defaultUser?: string } }) {
  userData.addCommands(
    `sudo adduser ${props.user} --disabled-password --gecos ""`,
    `sudo usermod -aG sudo ${props.user}`,
    `sudo echo "${props.user} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers`,
    `sudo mkdir /home/${props.user}/.ssh`,
    `sudo cp /home/${props.instance.defaultUser ?? 'ubuntu'}/.ssh/authorized_keys /home/${props.user}/.ssh/`,
    chown(props.user, `/home/${props.user}/.ssh`),
    `sudo chmod 600 /home/${props.user}/.ssh/authorized_keys`,
    `sudo chmod 700 /home/${props.user}/.ssh`,
  );
}
