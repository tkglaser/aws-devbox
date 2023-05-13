import { UserData } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { IConstruct } from 'constructs';

const enum CommandType {
  BeforeAptInstall,
  AptInstall,
  Command,
  S3Copy,
}

interface RegularCommand {
  type: CommandType.BeforeAptInstall | CommandType.AptInstall | CommandType.Command;
  cmd: string;
}

interface S3CopyCommand {
  type: CommandType.S3Copy;
  from: string;
  to: string;
}

type Command = RegularCommand | S3CopyCommand;

export class UserDataBuilder {
  private commands: Command[] = [];

  beforeAptInstall(...cmds: string[]): this {
    this.commands.push(...cmds.map((cmd) => ({ type: CommandType.BeforeAptInstall, cmd } as RegularCommand)));
    return this;
  }

  aptInstall(...pkgs: string[]): this {
    this.commands.push(...pkgs.map((cmd) => ({ type: CommandType.AptInstall, cmd } as RegularCommand)));
    return this;
  }

  cmd(...cmds: string[]): this {
    this.commands.push(...cmds.map((cmd) => ({ type: CommandType.Command, cmd } as RegularCommand)));
    return this;
  }

  s3Copy(from: string, to: string): this {
    this.commands.push({ type: CommandType.S3Copy, from, to });
    return this;
  }

  render(scope: IConstruct, instanceRole: Role): UserData {
    const userData = UserData.forLinux();
    this.commands
      .filter((cmd) => cmd.type === CommandType.BeforeAptInstall)
      .map((cmd) => (cmd as RegularCommand).cmd)
      .forEach((cmd) => {
        userData.addCommands(cmd);
      });

    userData.addCommands(`sudo apt-get update`);

    userData.addCommands(
      `sudo apt-get install -y ${this.commands
        .filter((cmd) => cmd.type === CommandType.AptInstall)
        .map((cmd) => (cmd as RegularCommand).cmd)
        .join(' ')}`,
    );

    let assetCounter = 0;
    this.commands
      .filter((cmd) => [CommandType.Command, CommandType.S3Copy].includes(cmd.type))
      .forEach((cmd) => {
        if (cmd.type === CommandType.Command) {
          userData.addCommands(cmd.cmd);
        } else if (cmd.type === CommandType.S3Copy) {
          const asset = new Asset(scope, `Asset${++assetCounter}`, { path: cmd.from });
          asset.grantRead(instanceRole);
          userData.addS3DownloadCommand({
            bucket: asset.bucket,
            bucketKey: asset.s3ObjectKey,
            localFile: cmd.to,
          });
        }
      });

    return userData;
  }
}
