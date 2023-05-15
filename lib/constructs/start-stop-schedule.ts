import { Stack } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnSchedule, CfnScheduleGroup } from 'aws-cdk-lib/aws-scheduler';
import { Construct, IConstruct } from 'constructs';

export interface StartStopScheduleProps {
  instanceId: string;
  start?: Schedule;
  stop?: Schedule;
  timeZone?: string;
}

export class StartStopSchedule extends Construct {
  constructor(scope: IConstruct, id: string, props: StartStopScheduleProps) {
    super(scope, id);

    const schedulerRole = new Role(this, 'SchedulerRole', {
      assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
      inlinePolicies: {
        schedule: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['ec2:startInstances', 'ec2:stopInstances'],
              resources: [
                Stack.of(this).formatArn({ service: 'ec2', resource: 'instance', resourceName: props.instanceId }),
              ],
            }),
          ],
        }),
      },
    });

    const group = new CfnScheduleGroup(this, 'InstanceManager', {
      name: 'instance-manager',
    });

    const commonScheduleProps = {
      groupName: group.name,
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      scheduleExpressionTimezone: props.timeZone,
    };

    const commonTargetProps = {
      roleArn: schedulerRole.roleArn,
      input: JSON.stringify({ InstanceIds: [props.instanceId] }),
      retryPolicy: {
        maximumEventAgeInSeconds: 60,
        maximumRetryAttempts: 3,
      },
    };

    if (props.start) {
      new CfnSchedule(this, 'StartInstances', {
        ...commonScheduleProps,
        description: 'Event that starts instances',
        scheduleExpression: props.start.expressionString,
        target: {
          ...commonTargetProps,
          arn: 'arn:aws:scheduler:::aws-sdk:ec2:startInstances',
        },
      });
    }

    if (props.stop) {
      new CfnSchedule(this, 'StopInstances', {
        ...commonScheduleProps,
        description: 'Event that stops instances',
        scheduleExpression: props.stop.expressionString,
        target: {
          ...commonTargetProps,
          arn: 'arn:aws:scheduler:::aws-sdk:ec2:stopInstances',
        },
      });
    }
  }
}
