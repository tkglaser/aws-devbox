export const deploymentRoleName = (user: string, profile: string) =>
  `${user}-access-${profile.replaceAll('+', '-')}`;
