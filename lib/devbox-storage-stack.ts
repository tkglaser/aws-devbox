import { RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import { CfnLifecyclePolicy } from 'aws-cdk-lib/aws-dlm';
import { EbsDeviceVolumeType, ISubnet, Volume, Vpc } from 'aws-cdk-lib/aws-ec2';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { config } from '../config/config';

export interface DevboxStorageStackProps extends StackProps {
  vpc: Vpc;
  vpcSubnet: ISubnet;
}

export class DevboxStorageStack extends Stack {
  public volume: Volume;

  constructor(scope: Construct, id: string, props: DevboxStorageStackProps) {
    super(scope, id, props);

    this.volume = new Volume(this, 'DevVolume', {
      availabilityZone: props.vpcSubnet.availabilityZone,
      size: Size.gibibytes(100),
      volumeName: 'DevVolume',
      volumeType: EbsDeviceVolumeType.GP3,
      removalPolicy: RemovalPolicy.DESTROY,
      ...config.volume?.properties,
      encrypted: true,
    });

    const lifeCycleExecutionRole = new Role(this, 'DevBoxBackupRole', {
      assumedBy: new ServicePrincipal('dlm.amazonaws.com'),
      inlinePolicies: {
        snapshot: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'ec2:CreateSnapshot',
                'ec2:CreateSnapshots',
                'ec2:DeleteSnapshot',
                'ec2:DescribeInstances',
                'ec2:DescribeVolumes',
                'ec2:DescribeSnapshots',
                'ec2:EnableFastSnapshotRestores',
                'ec2:DescribeFastSnapshotRestores',
                'ec2:DisableFastSnapshotRestores',
                'ec2:CopySnapshot',
                'ec2:ModifySnapshotAttribute',
                'ec2:DescribeSnapshotAttribute',
                'ec2:DescribeSnapshotTierStatus',
                'ec2:ModifySnapshotTier',
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              actions: ['ec2:CreateTags'],
              resources: ['arn:aws:ec2:*::snapshot/*'],
            }),
            new PolicyStatement({
              actions: [
                'ec2:CreateTags',
                'events:PutRule',
                'events:DeleteRule',
                'events:DescribeRule',
                'events:EnableRule',
                'events:DisableRule',
                'events:ListTargetsByRule',
                'events:PutTargets',
                'events:RemoveTargets',
              ],
              resources: ['arn:aws:events:*:*:rule/AwsDataLifecycleRule.managed-cwe.*'],
            }),
          ],
        }),
      },
    });

    const schedules: CfnLifecyclePolicy.ScheduleProperty[] = [];

    if ((config.volume?.backup?.daily?.retained ?? 0) > 0) {
      schedules.push({
        name: 'Daily',
        createRule: {
          interval: 24,
          intervalUnit: 'HOURS',
          times: ['02:00'],
        },
        retainRule: {
          interval: config.volume!.backup!.daily!.retained,
          intervalUnit: 'DAYS',
        },
      });
    }

    if ((config.volume?.backup?.weekly?.retained ?? 0) > 0) {
      schedules.push({
        name: 'Weekly',
        createRule: {
          cronExpression: 'cron(00 09 ? * SAT *)',
        },
        retainRule: {
          interval: config.volume!.backup!.weekly!.retained,
          intervalUnit: 'WEEKS',
        },
      });
    }

    if ((config.volume?.backup?.monthly?.retained ?? 0) > 0) {
      schedules.push({
        name: 'Monthly',
        createRule: {
          cronExpression: 'cron(00 01 1 * ? *)',
        },
        retainRule: {
          interval: config.volume!.backup!.monthly!.retained,
          intervalUnit: 'MONTHS',
        },
      });
    }

    if (schedules.length) {
      new CfnLifecyclePolicy(this, 'DevVolumeBackup', {
        tags: [{ key: 'Name', value: 'DevVolume Backup' }],
        description: 'Backup schedule for DevVolume',
        executionRoleArn: lifeCycleExecutionRole.roleArn,
        state: 'ENABLED',
        policyDetails: {
          policyType: 'EBS_SNAPSHOT_MANAGEMENT',
          targetTags: [{ key: 'Name', value: 'DevVolume' }],
          resourceLocations: ['CLOUD'],
          resourceTypes: ['VOLUME'],
          schedules,
        },
      });
    }
  }
}
