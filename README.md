# AWS Cloud Development Box

This project creates an EC2 instance that can be used to develop solutions in AWS. The project has the following features:

* The instance can be powered off by a CRON schedule
* Access to other AWS accounts is automatically configured
* Tools can be installed automatically in a flexible way
* The instance is contained in a dedicated VPC with no access from the outside (depending on configuration)
* The solution creates a separate EBS volume and automatically mounts it so that you can safely tear down and rebuild your instance without losing data

## Getting started
### Dependencies
This project is developed with and tested on Node v18. First, install packages by running
```
npm install
```

### Key Pair
You need to create a key pair in the AWS console. Make a note of the name of that key and where you saved the associated PEM file.

### AWS CLI and Session Manager Plugin
You need the AWS CLI to deploy the solution [Installing or updating the latest version of the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html). If you wish to use the AWS CLI Session Manager you need to [install the relevant plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html).

We recommend that you use the Session Manager plugin for connecting. But if you can't use the plugin, you can configure the solution to use public IP access instead.

### Create a configuration file
Create a file in `config/config.ts`. For example, like this:
```ts
import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';

import { Config, NetworkingMode } from '../models/config';

export const config: Config = {
  user: 'useronbox',
  userName: 'John Doe',
  email: 'john@example.com',
  timeZone: 'Europe/London',
  locale: 'en_GB.UTF-8',
  networkingMode: NetworkingMode.AWS_SSM,
  account: {
    id: '111111111111',
    profile: 'my-dev-account',
    region: 'my-region',
    bootstrapPolicies: ['AdministratorAccess'], // Choose a more restrictive policy if possible
  },
  instance: {
    type: InstanceType.of(InstanceClass.T3, InstanceSize.XLARGE2),
    // Latest Ubuntu Minimal Server
    amiSsmParameter: '/aws/service/canonical/ubuntu/server-minimal/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id',
  },
  autoSwitch: { // optionally start and stop the instance at certain times
    on: Schedule.cron({ hour: '8', minute: '0' }), // switch on at 8am
    off: Schedule.cron({ hour: '18', minute: '0' }), // switch off at 6pm
  },
  sshKey: {
    name: 'my-key-name', // name in the AWS Console
    file: '/path/to/my-key-name.pem', // file on local disk
  },
  deploymentAccounts: [
    { // The devbox will be able to access this account
      id: '222222222222', 
      profile: 'my-test-account',
      region: 'my-region',
      bootstrapPolicies: ['IAMFullAccess', 'AmazonSSMReadOnlyAccess'] // Policies used for the CDK Toolkit Stack
      policies: { // The permissions that the devbox will have in the account
        s3Access: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:*'],
              resources: ['*'],
            }),
          ],
        }),
      }
    },
  ],
};
```

Hover over each individual field to get help via JSDocs.

## Deploying the solution

Deploy the solution via `npm start`. Once the deployment is complete, you'll be able to access the devbox via `ssh devbox`.

## Other commands

* `npm start` deploys the instance. It can be run again after you've updated the config or to start an instance that has been stopped.
* `npm stop` stops the instance.
* `npm run destroy` terminates the instance. This means that a brand new instance will be created when you next run `npm start`. Your files should still be preserved because they are stored on a separate EBS volume that is retained.

## Access to different AWS accounts
The devbox will be able to access other AWS accounts if you have configured accounts in the `deploymentAccounts` config key. This is done by deploying a cross-account role in each of the deployment accounts. This role is configured so that the devbox instance role can assume the deployment account role. This is done by switching aws profiles. For example, if you have `deploymentAccounts` configured like this:
```ts
 deploymentAccounts: [
    {
      id: '222222222222',
      profile: 'my-test-account',
      region: 'eu-west-2',
    },
  ],
```

On the devbox, the `~/.aws/config` file will contain this:
```ini
[profile my-test-account]
output = json
region = eu-west-2
role_arn = arn:aws:iam::222222222222:role/deploy-from-111111111111-useronbox
credential_source = Ec2InstanceMetadata
```

This means that aws cli commands like the following will work on the devbox:
```sh
aws --profile my-test-account s3 ls
```

Note that the role in the deployment account is called `deploy-from-111111111111-useronbox`. Which permissions the role has can be changed in `lib/devbox-deployment-stack.ts`.

## Connecting to the instance
The `npm start` will automatically configure your SSH configuration in `~/.ssh/config`.

You can connect to the instance via:
* `ssh devbox`
* VS Code SSH plugin, connect to host `devbox`

### Using the VS Code server

The instance has a VS Code server installed that you can use via the browser. You can connect to the VS Code server via:
1. Run `ssh devbox-ports` in a console and leave it running. This will connect port `3000` from the instance back to your local machine.
2. Open a browser and go to `http://localhost:3000`. You should see a VS Code environment.

To open a project on the devbox, Select **File** > **Open Folder** and navigate to a folder on the devbox.

## Synching data
We recommend using Unison to sync data between machines. Unison is installed on the box automatically. First, create a profile
in `~/.unison/myprofile.prf`. Here is an example:

```ini
# Unison preferences
ignore = Name node_modules
ignore = Name temp
ignore = Name .test
ignore = Name cdk.out/*
ignore = Name build/*

root = /my/local/folder
root = ssh://useronbox@devbox//home/useronbox/my/remote/folder

# Optional, sync selected subfolders only
path = projects
path = documents
sshargs = -C
```

Then, run Unison in a terminal, for example like this:
```bash
> unison myprofile -batch -repeat 10
```