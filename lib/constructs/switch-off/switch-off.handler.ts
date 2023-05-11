import { EC2Client, StopInstancesCommand } from '@aws-sdk/client-ec2';

const client = new EC2Client({});
const config = {
  instanceId: process.env.APP_INSTANCE_ID!,
};

export async function handler() {
  await client.send(
    new StopInstancesCommand({
      InstanceIds: [config.instanceId],
    }),
  );

  return {
    statusCode: 200,
  };
}
