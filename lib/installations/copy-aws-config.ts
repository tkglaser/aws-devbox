import * as path from 'path';

import { chown } from './utils/ubuntu-commands';
import { UserDataBuilder } from './utils/user-data-builder';

export function copyAwsConfig(
  userData: UserDataBuilder,
  props: {
    user: string;
  },
) {
  userData.s3Copy(path.join(__dirname, '../../assets/aws.config'), `/home/${props.user}/.aws/config`);
  userData.cmd(chown(props.user, `/home/${props.user}/.aws`));
}
