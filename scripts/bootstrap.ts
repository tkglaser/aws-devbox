import { config } from '../config/config';
import { runCommand } from '../util/run-command';
import type { Account } from '../models/config';

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
    if (accountsOrRegionsAreDifferent(targetAccount, config.account)) {
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
  }

  await Promise.all(processes);
}

function accountsOrRegionsAreDifferent(a: Account, b: Account) {
  return a.id !== b.id || a.region !== b.region;
}

const executionPolicies = (...policies: string[]) =>
  policies.map((policy) => ['--cloudformation-execution-policies', `arn:aws:iam::aws:policy/${policy}`]).flat();

bootstrap();
