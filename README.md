# AWS Cloud Development Box

## Commands
* `npm start` create the EC2 instance, start it, update an entry in `/etc/hosts`
* `npm stop` stops the instance
* `npm run destroy` tears down the instance but not any persistent storage

## Architecture
* VPC with one public subnet
* One EBS Volume as the main storage
* Deployment roles in all accounts that the box will deploy to
* EC2 instance
  * security group allows only access from the current IP (rerun `npm start` to refresh)
  * All relevant tools are installed via user data
  * The instance role is configured to be able to assume the deployment roles in other accounts
  * The `~/.aws/config` is configured with profiles that link to the deployment roles of other accounts.
  * The EC2 instance uses an SSH key for passwordless access. The key must be created in the AWS console first and supplied here via config. The key PEM file is added to the local SSH key chain which will mean you'll be able to connect with just `ssh devbox`.
  * Optionally, you can configure a daily cron job to switch the instance off.
