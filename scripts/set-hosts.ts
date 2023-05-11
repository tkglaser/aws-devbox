import { env } from '../lib/env';
import { TextFile } from '../util/text-file';

function updateHostsFile() {
  const ip = env().instanceIp;

  const hostsFile = new TextFile('/etc/hosts');
  let found = false;

  const hostsUpdated = hostsFile.content.map((line) => {
    if (line.endsWith(' devbox')) {
      found = true;
      return `${ip} devbox`;
    }
    return line;
  });

  if (!found) {
    hostsUpdated.push(`${ip} devbox`);
  }

  hostsFile.content = hostsUpdated;
}

updateHostsFile();
