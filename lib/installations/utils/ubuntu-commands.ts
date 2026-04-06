/**
 * Changes ownership of a file
 */
export const chown = (user: string, path: string) => `sudo chown -R ${user}:${user} ${path}`;

/**
 * Runs command as a user
 */
export const runAs = (user: string, cmd: string) => `sudo runuser -l ${user} -c '${cmd}'`;

/**
 * An escaped $ for when you need to generate a script that contains a $
 */

// biome-ignore lint/suspicious/noUselessEscapeInString: This is to have the character verbatim in a script
export const $ = (v: string) => `\\\$${v}`;
