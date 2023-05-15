import { config } from '../config/config';
import { runCommand } from '../util/run-command';

async function bootstrap() {
  const processes = [];
  processes.push(
    runCommand({
      command: 'cdk',
      args: [
        'bootstrap',
        '--profile',
        config.account.profile,
        ...executionPolicies('AdministratorAccess'),
        '--output',
        `cdk.out.bootstrap/${config.account.id}`,
        `aws://${config.account.id}/${config.account.region}`,
      ],
    }),
  );

  for (const targetAccount of config.deploymentAccounts) {
    processes.push(
      runCommand({
        command: 'cdk',
        args: [
          'bootstrap',
          '--profile',
          targetAccount.profile,
          ...executionPolicies('IAMFullAccess', 'AmazonSSMReadOnlyAccess'),
          '--output',
          `cdk.out.bootstrap/${targetAccount.id}`,
          '--trust',
          config.account.id,
          `aws://${targetAccount.id}/${targetAccount.region}`,
        ],
      }),
    );
  }

  await Promise.all(processes);
}

const executionPolicies = (...policies: string[]) =>
  policies.map((policy) => ['--cloudformation-execution-policies', `arn:aws:iam::aws:policy/${policy}`]).flat();

bootstrap();
