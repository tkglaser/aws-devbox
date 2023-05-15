import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { AccountPrincipal, IRole, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { IConstruct } from 'constructs';

export interface DevboxDeploymentStackProps extends StackProps {
  instanceRole: IRole;
}

export class DevboxDeploymentStack extends Stack {
  constructor(scope: IConstruct, id: string, props: DevboxDeploymentStackProps) {
    super(scope, id, props);

    const deploymentRole = new Role(this, 'DeploymentRole', {
      roleName: 'devbox-deployment-role',
      assumedBy: new AccountPrincipal(Stack.of(props.instanceRole).account),
      inlinePolicies: {
        deploy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'cloudformation:UpdateTerminationProtection',
                'cloudformation:GetTemplate',
                'cloudformation:GetTemplateSummary',
                'cloudformation:DescribeStacks',
                'cloudformation:CreateStack',
                'cloudformation:UpdateStack',
                'cloudformation:DeleteStack',
                'cloudformation:RollbackStack',
                'cloudformation:DescribeStackEvents',
                'cloudformation:DescribeChangeSet',
                'cloudformation:ListChangeSets',
                'cloudformation:CreateChangeSet',
                'cloudformation:DeleteChangeSet',
                'cloudformation:ExecuteChangeSet',
                'cloudformation:TagResource',
                'cloudformation:UntagResource',
              ],
              resources: [
                this.formatArn({ service: 'cloudformation', region: '*', resource: 'stack', resourceName: '*' }),
              ],
            }),
            new PolicyStatement({
              actions: ['cloudformation:ValidateTemplate'],
              resources: ['*'],
            }),
            new PolicyStatement({
              actions: [
                'iam:GetRole',
                'iam:PassRole',
                'iam:CreateRole',
                'iam:DeleteRole',
                'iam:UpdateRole',
                'iam:UpdateRoleDescription',
                'iam:TagRole',
                'iam:UntagRole',
                'iam:GetRolePolicy',
                'iam:PutRolePolicy',
                'iam:AttachRolePolicy',
                'iam:DetachRolePolicy',
                'iam:DeleteRolePolicy',
              ],
              resources: [this.formatArn({ service: 'iam', region: '', resource: 'role', resourceName: 'cdk-*' })],
            }),
            new PolicyStatement({
              actions: ['sts:AssumeRole'],
              resources: [this.formatArn({ service: 'iam', region: '', resource: 'role', resourceName: 'cdk-*' })],
            }),
            new PolicyStatement({
              actions: [
                'iam:GetPolicyVersion',
                'iam:CreatePolicyVersion',
                'iam:DeletePolicyVersion',
                'iam:GetPolicy',
                'iam:CreatePolicy',
                'iam:DeletePolicy',
                'iam:ListPolicyVersions',
              ],
              resources: [this.formatArn({ service: 'iam', region: '', resource: 'policy', resourceName: '*' })],
            }),
            new PolicyStatement({
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:PutParameter',
                'ssm:DeleteParameter',
                'ssm:LabelParameterVersion',
                'ssm:UnlabelParameterVersion',
              ],
              resources: [this.formatArn({ service: 'ssm', region: '*', resource: 'parameter', resourceName: '*' })],
            }),
            new PolicyStatement({
              actions: ['ecr:CreateRepository'],
              resources: ['*'],
            }),
            new PolicyStatement({
              actions: [
                'ecr:DeleteRepository',
                'ecr:GetRepositoryPolicy',
                'ecr:SetRepositoryPolicy',
                'ecr:DeleteRepositoryPolicy',
                'ecr:DescribeRepositories',
                'ecr:PutLifecyclePolicy',
              ],
              resources: [
                this.formatArn({ service: 'ecr', region: '*', resource: 'repository', resourceName: 'cdk-*' }),
              ],
            }),
            new PolicyStatement({
              actions: [
                's3:CreateBucket',
                's3:DeleteBucket',
                's3:GetBucketPolicy',
                's3:PutBucketPolicy',
                's3:DeleteBucketPolicy',
                's3:GetBucketPolicyStatus',
                's3:GetBucketVersioning',
                's3:PutBucketVersioning',
                's3:GetEncryptionConfiguration',
                's3:PutEncryptionConfiguration',
                's3:GetBucketPublicAccessBlock',
                's3:PutBucketPublicAccessBlock',
                's3:PutLifecycleConfiguration',
              ],
              resources: [this.formatArn({ service: 's3', region: '', account: '', resource: 'cdk-*' })],
            }),
          ],
        }),
      },
    });

    deploymentRole.grantAssumeRole(props.instanceRole);

    new CfnOutput(this, 'DeploymentRoleARN', {
      value: deploymentRole.roleArn,
    });
  }
}
