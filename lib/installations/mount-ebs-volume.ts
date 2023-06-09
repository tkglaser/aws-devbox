import { Volume } from 'aws-cdk-lib/aws-ec2';

import { chown } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

export function mountExternalVolume(
  userData: UserDataBuilder,
  volume: Volume,
  props: {
    user: string;
    instance: { volumeMountTarget?: string };
    account: { region: string };
  },
) {
  const path = props.instance.volumeMountTarget ?? `/home/${props.user}/projects`;
  const targetDevice = '/dev/sdf';
  const internalDevice = '/dev/nvme1n1'; // EBS optimised is mounted as NVMe
  userData.cmd(
    `sudo mkdir ${path}`,
    chown(props.user, path),
    `InstanceID=$(ls /var/lib/cloud/instances)`,
    `aws --region ${props.account.region} ec2 attach-volume --volume-id ${volume.volumeId} --instance-id $InstanceID --device ${targetDevice}`,
    `while ! test -e ${internalDevice}; do sleep 1; done`,
    `sudo sh -c 'echo "${internalDevice} ${path} ext4 defaults,nofail 0 0" >> /etc/fstab'`,
    `sleep 1 ; sudo mount -a || (mkfs -t ext4 ${internalDevice} && sleep 1 && mount -a && (${chown(
      props.user,
      path,
    )} && echo "Formatted dev volume") || echo "Failed to format and mount the dev volume" )`,
  );
}
