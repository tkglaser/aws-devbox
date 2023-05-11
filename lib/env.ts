export function env() {
  return {
    instanceId: process.env.DEVBOX_INSTANCE_ID!,
    instanceIp: process.env.DEVBOX_IP!,
  };
}
