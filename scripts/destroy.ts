import { config } from '../config/config';
import { runCommand } from '../util/run-command';

runCommand({
  command: 'cdk',
  args: ['destroy', 'DevboxStack', '--force', '--profile', config.account.profile],
});
