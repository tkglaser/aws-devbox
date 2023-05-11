import { UserData, Volume } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';

import { config } from '../config/config';

export class DevboxUserData {
  private readonly userData = UserData.forLinux();

  constructor(private readonly props: { user: string }) {}

  installGlobalTools({ userName, email }: { userName: string; email: string }) {
    this.userData.addCommands(
      `cd ~ && curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -`,
      'sudo apt-get update -y',
      'sudo apt-get install -y ' + config.tools.apt.join(' '),
      `sudo locale-gen en_GB.UTF-8`,
      `sudo update-locale LANG=en_GB.UTF-8`,
      `sudo npm i -g ` + config.tools.npm.join(' '),
      `sudo runuser -l ${this.props.user} -c 'git config --global user.name "${userName}"'`,
      `sudo runuser -l ${this.props.user} -c 'git config --global user.email "${email}"'`,
      `sudo runuser -l ${this.props.user} -c 'echo "export NODE_OPTIONS=--max-old-space-size=4096" >> ~/.bashrc'`,
    );
  }

  createUser() {
    this.userData.addCommands(
      `sudo adduser ${this.props.user} --disabled-password --gecos ""`,
      `sudo usermod -aG sudo ${this.props.user}`,
      `sudo echo "${this.props.user} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers`,
    );
  }

  copyKeys({ fromUser }: { fromUser: string }) {
    this.userData.addCommands(
      `sudo mkdir /home/${this.props.user}/.ssh`,
      `sudo cp /home/${fromUser}/.ssh/authorized_keys /home/${this.props.user}/.ssh/`,
      chown(this.props.user, `/home/${this.props.user}/.ssh`),
      `sudo chmod 600 /home/${this.props.user}/.ssh/authorized_keys`,
      `sudo chmod 700 /home/${this.props.user}/.ssh`,
    );
  }

  mountExternalVolume({
    volume,
    path,
    targetDevice,
    internalDevice,
    region,
  }: {
    volume: Volume;
    path: string;
    targetDevice: string;
    internalDevice: string;
    region: string;
  }) {
    this.userData.addCommands(
      `sudo mkdir ${path}`,
      chown(this.props.user, path),
      `InstanceID=$(ls /var/lib/cloud/instances)`,
      `aws --region ${region} ec2 attach-volume --volume-id ${volume.volumeId} --instance-id $InstanceID --device ${targetDevice}`,
      `while ! test -e ${internalDevice}; do sleep 1; done`,
      `sudo sh -c 'echo "${internalDevice} ${path} ext4 defaults,nofail 0 0" >> /etc/fstab'`,
      `sleep 1 ; sudo mount -a || (mkfs -t ext4 ${internalDevice} && sleep 1 && mount -a && (${chown(
        this.props.user,
        path,
      )} && echo "Formatted dev volume") || echo "Failed to format and mount the dev volume" )`,
    );
  }

  copyAwsConfig({ from, readerRole }: { from: Asset; readerRole: Role }) {
    from.grantRead(readerRole);

    this.userData.addS3DownloadCommand({
      bucket: from.bucket,
      bucketKey: from.s3ObjectKey,
      localFile: `/home/${this.props.user}/.aws/config`,
    });

    this.userData.addCommands(chown(this.props.user, `/home/${this.props.user}/.aws`));
  }

  get data() {
    return this.userData;
  }
}

function chown(user: string, path: string) {
  return `sudo chown -R ${user}:${user} ${path}`;
}
