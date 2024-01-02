export const deploymentRoleName = (user: string, account: string, region: string) =>
  `deploy-from-${account}-${user}-${region}`;
