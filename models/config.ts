import { InstanceType, VolumeProps } from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { PolicyDocument } from 'aws-cdk-lib/aws-iam';

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

  /**
   * Managed policies to apply to the CDK Toolkit Stack
   */
  bootstrapPolicies?: string[];
}

export interface Account extends BaseAccount {
  /**
   * Inline policies to create in the deployment accounts
   */
  policies?: {
    [name: string]: PolicyDocument;
  };
}

export const enum NetworkingMode {
  /**
   * Using AWS Session Manager (recommended).
   *
   * You need to install the Session Manager plugin for the AWS CLI
   * @see https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
   *
   * The devbox instance will be installed into a private subnet and will not
   * be directly reachable from the public internet.
   */
  AWS_SSM,

  /**
   * Using a public IP.
   *
   * If you cannot use the AWS Session Manager plugin, use this setting. The instance will be
   * created in a public subnet and will be assigned a public IP. A network security group will
   * be created and configured such that access is only possible from your public IP. When your
   * public IP changes, you need to run the deployment script again which will update the security
   * group configuration.
   */
  PUBLIC_IP,
}

interface EBSSnapshotSettings {
  /**
   * Number of snapshots that are retained.
   */
  retained?: number;
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
   * The networking configuration used to connect to your devbox.
   * Please look at the options of `NetworkingMode` carefully to decide.
   * Changing this later may require you to tear down the devbox and the VPC.
   */
  networkingMode: NetworkingMode;

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
    properties?: Omit<VolumeProps, 'encrypted'>;

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
      version: '16' | '18' | '20';
    };

    /**
     * Install Docker
     */
    docker?: {
      install: true;
    };

    /**
     * Jetpack Devbox
     *
     * @see https://www.jetpack.io/devbox
     */
    devbox?: {
      install: true;
    };
  };
}
