import { IPeer, InstanceType, Port, VolumeProps } from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { PolicyDocument, RoleProps } from 'aws-cdk-lib/aws-iam';

export interface BaseAccount {
  /**
   * The name of the AWS CLI profile to use to access this account
   */
  profile: string;

  /**
   * The AWS Account ID
   *
   * @example "123456789012"
   */
  id: string;

  /**
   * The default region.
   *
   * For the main account, this will be the region where the devbox will reside.
   * For deployment accounts, this determines the region of the CloudFormation stacks.
   */
  region: string;
}

export interface Account extends BaseAccount {
  /**
   * Settings such as permissions for the access role to the account
   */
  accessRole: Omit<RoleProps, 'roleName' | 'assumedBy'>;
}

interface EBSSnapshotSettings {
  /**
   * Number of snapshots that are retained.
   */
  retained?: number;
}

interface SecurityGroupRule {
  peer: IPeer;
  port: Port;
  description?: string;
}

export interface Config {
  /**
   * The user you wish to log in as. It makes sense to set this to the same user name as
   * you use on your physical computer to minimise friction.
   */
  user: string;

  /**
   * Your full name. This is used to configure the git client on the devbox.
   */
  userName: string;

  /**
   * Your email. This is used to configure the git client on the devbox.
   */
  email: string;

  /**
   * The timezone to use for the machine.
   *
   * @see https://www.iana.org/time-zones
   *
   * @example Europe/London
   */
  timeZone: string;

  language: {
    /**
     * The OS locale.
     *
     * Ensure, that for non-default locales, the relevant language pack is installed.
     *
     * @see `languagePacks`
     *
     * @example en_GB.UTF-8
     */
    defaultLocale: string;

    /**
     * Additional OS language packs to install
     */
    languagePacks?: string[];

    /**
     * Other locales to install.
     *
     * The default locale is installed automatically.
     */
    locales?: string[];
  };

  /**
   * Set this to `true` if the box needs a public IP
   *
   * @default false
   */
  needsPublicIp?: true;

  /**
   * Settings related to the EC2 instance
   */
  instance: {
    /**
     * AWS EC2 instance type.
     *
     * @example InstanceType.of(InstanceClass.T3, InstanceSize.XLARGE2)
     */
    type: InstanceType;

    /**
     * The SSM Parameter that is read to determine the AMI to use.
     *
     * @example /aws/service/canonical/ubuntu/server-minimal/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id
     *
     * NOTE: This project has only been tested with Ubuntu images. It is unlikely to work with anything else
     * at this time.
     */
    amiSsmParameter: string;

    /**
     * The mount point of the additional EBS volume.
     *
     * To ensure that the devbox can be rebuilt without losing data, an additional persistent EBS volume is created
     * and automatically mounted.
     *
     * @default /home/$user/projects
     */
    volumeMountTarget?: string;

    /**
     * The default user of the AMI.
     *
     * This is used for copying access keys to the new OS user.
     *
     * @default ubuntu
     */
    defaultUser?: string;
  };

  /**
   * Settings related to the persistent development volume.
   */
  volume?: {
    /**
     * Properties of the volume, for example volume size.
     *
     * @default 100GB GP3
     */
    properties?: Partial<Omit<VolumeProps, 'encrypted'>>;

    /**
     * EBS Snapshot settings
     *
     * @default No backup
     */
    backup?: {
      daily?: EBSSnapshotSettings;
      weekly?: EBSSnapshotSettings;
      monthly?: EBSSnapshotSettings;
      crossRegionBackupTo?: string;
    };
  };

  /**
   * Automatically switch the instance on or off
   */
  autoSwitch?: {
    /**
     * Automatically stop the instance at a certain time (or times).
     *
     * @example Schedule.cron({ minute: '0', hour: '7', weekDay: 'MON-FRI' })
     *
     * @default never
     */
    on?: Schedule;

    /**
     * Automatically stop the instance at a certain time (or times).
     *
     * @example Schedule.cron({ minute: '0', hour: '18' })
     *
     * @default never
     */
    off?: Schedule;
  };

  /**
   * The SSH Key to use to connect to the instance
   */
  sshKey: {
    /**
     * The name of the key as displayed in the AWS Console
     */
    name: string;

    /**
     * The fully qualified name and path of the PEM file that you downloaded after creating the key
     */
    file: string;
  };

  /**
   * The AWS account where the devbox will reside.
   */
  account: BaseAccount;

  ports?: {
    /**
     * Ports to forward from the remote machine to the local machine
     */
    remoteToLocal?: number[];
  };

  securityGroupRules?: {
    inbound?: SecurityGroupRule[];
    outbound?: SecurityGroupRule[];
  };

  /**
   * List of AWS accounts that the devbox will have access to.
   *
   * The `profile` for each account has to exist on the local computer. It will
   * be used to deploy a role which the devbox can assume cross-account. The profile
   * will then also be available under the same name on the devbox instance.
   */
  deploymentAccounts: Account[];

  features: {
    /**
     * Install Visual Studio Code Server
     */
    vsCodeServer?: {
      install: true;
      /**
       * The port for running VS Code Server.
       *
       * @default 3000
       */
      port?: number;
    };

    /**
     * Install Node
     */
    node?: {
      install: true;
    };

    /**
     * Install Docker
     */
    docker?: {
      install: true;
    };

    /**
     * OpenJDK
     */
    java?: {
      install: true;
      package: string;
    };

    /**
     * Maven
     */
    maven?: {
      install: true;
    };

    /**
     * .NET
     */
    dotnet?: {
      install: true;
      versions: ('8.0' | '7.0' | '6.0')[];
    };
  };
}
