export const chown = (user: string, path: string) => `sudo chown -R ${user}:${user} ${path}`;
export const runAs = (user: string, cmd: string) => `sudo runuser -l ${user} -c '${cmd}'`;
