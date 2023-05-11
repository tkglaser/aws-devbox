import { config } from '../config/config';
import { runCommand } from '../util/run-command';

async function bootstrap() {
  await runCommand({
    command: 'cdk',
    args: [
      'bootstrap',
      '--profile',
      config.account.profile,
      '--cloudformation-execution-policies',
      'arn:aws:iam::aws:policy/AdministratorAccess',
      `aws://${config.account.id}/${config.account.region}`,
    ],
  });

  for (const targetAccount of config.deploymentAccounts) {
    await runCommand({
      command: 'cdk',
      args: [
        'bootstrap',
        '--profile',
        targetAccount.profile,
        '--cloudformation-execution-policies',
        'arn:aws:iam::aws:policy/IAMFullAccess',
        `aws://${targetAccount.id}/${targetAccount.region}`,
      ],
    });
  }
}

bootstrap();
