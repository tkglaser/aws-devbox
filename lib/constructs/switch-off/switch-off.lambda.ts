import { Stack } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IConstruct } from 'constructs';
import * as path from 'path';

export interface SwitchOffLambdaProps {
  instanceId: string;
}

export class SwitchOffLambda extends NodejsFunction {
  constructor(scope: IConstruct, id: string, props: SwitchOffLambdaProps) {
    super(scope, id, {
      entry: path.join(__dirname, './switch-off.handler.ts'),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        APP_INSTANCE_ID: props.instanceId,
      },
    });

    this.addToRolePolicy(
      new PolicyStatement({
        actions: ['ec2:StopInstances'],
        resources: [Stack.of(this).formatArn({ service: 'ec2', resource: 'instance', resourceName: props.instanceId })],
      }),
    );
  }
}
