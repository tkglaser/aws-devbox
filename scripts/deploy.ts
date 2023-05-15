import { config } from '../config/config';
import { runCommand } from '../util/run-command';

runCommand({
  command: 'cdk',
  args: [
    'deploy',
    '--all',
    '--profile',
    config.account.profile,
    '--concurrency',
    '4',
    '--require-approval',
    'never',
    '--outputs-file',
    'cdk.out.json',
  ],
});
