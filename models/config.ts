import { InstanceType } from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';

interface Account {
  profile: string;
  id: string;
  region: string;
}

export interface Config {
  user: string;
  userName: string;
  email: string;
  instance: {
    type: InstanceType;
    amiSsmParameter: string;
    volumeMountTarget?: string;
    defaultUser?: string;
  };
  autoSwitchOff?: Schedule;
  sshKey: { name: string; file: string };
  tools: {
    apt: string[];
    npm: string[];
  };
  account: Account;
  deploymentAccounts: Account[];
}
