import { UserDataBuilder } from './utils/user-data-builder';

export function dotnet(
  userData: UserDataBuilder,
  props: { user: string; features: { dotnet?: { versions: string[] } } },
) {
  userData.aptInstall(...props.features.dotnet!.versions.map((version) => `dotnet-sdk-${version}`));
}
