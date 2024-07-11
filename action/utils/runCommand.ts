import { execSync } from "child_process";
export function runCommand(
  command: string,
  options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    requireAuth?: {
      HCP_ORGANIZATION_ID: string;
      HCP_PROJECT_ID: string;
      HCP_CLIENT_ID: string;
      HCP_CLIENT_SECRET: string;
    };
  }
): string | null {
  try {
    const commands = [command];
    if (options && options.requireAuth) {
      commands.unshift(
        `hcp profile set project_id ${options.requireAuth.HCP_PROJECT_ID}`
      );
      commands.unshift(
        `hcp profile set organization_id ${options.requireAuth.HCP_ORGANIZATION_ID}`
      );
      commands.unshift(
        `hcp auth login --client-id ${options.requireAuth.HCP_CLIENT_ID} --client-secret ${options.requireAuth.HCP_CLIENT_SECRET}`
      );
    }
    const allCommands = commands.join(";");
    // Run the command and store the output as a Buffer
    const outputBuffer = execSync(allCommands, {
      cwd: options?.cwd,
      env: options?.env
        ? {
            ...process.env,
            ...options.env,
          }
        : process.env,
      shell: "/bin/bash",
    });
    // Convert the output Buffer to a string and return it
    const output = outputBuffer.toString();
    return output;
  } catch (error: any) {
    console.log(JSON.stringify(error.output[1].toString()));
    // Handle any errors that occur during command execution
    console.error(`Error executing command: ${error}`);
    return null;
  }
}
