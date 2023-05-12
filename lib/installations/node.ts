import { UserData } from 'aws-cdk-lib/aws-ec2';
import { runAs } from './utils/ubuntu-commands';

export function nodeAndTools(userData: UserData, props: { user: string }) {
  userData.addCommands(
    `cd ~ && curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -`,
    'sudo apt-get install -y nodejs',
    `sudo npm i -g pnpm @microsoft/rush aws-cdk`,
    runAs(props.user, `echo "export NODE_OPTIONS=--max-old-space-size=4096" >> ~/.bashrc`),
  );
}
