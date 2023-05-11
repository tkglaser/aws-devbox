import { UserData } from 'aws-cdk-lib/aws-ec2';

export function globalToolsAndSettings(userData: UserData, props: { user: string; userName: string; email: string }) {
  userData.addCommands(
    'sudo apt-get update -y',
    'sudo apt-get install -y --no-install-recommends apt-utils',
    'sudo apt-get install -y locales git awscli unison nano mc build-essential python3-pip',
    'sudo pip3 install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz',
    'sudo mkdir /opt/aws',
    'sudo mkdir /opt/aws/bin',
    'sudo ln -s /usr/local/bin/cfn-signal /opt/aws/bin/cfn-signal',
    `sudo locale-gen en_GB.UTF-8`,
    `sudo update-locale LANG=en_GB.UTF-8`,
    `sudo runuser -l ${props.user} -c 'git config --global user.name "${props.userName}"'`,
    `sudo runuser -l ${props.user} -c 'git config --global user.email "${props.email}"'`,
  );
}
