import { execSync } from "child_process";
export function runCommand(
  command: string,
  options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  }
): string | null {
  try {
    // Run the command and store the output as a Buffer
    const outputBuffer = execSync(command, {
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
    console.log(output);
    return output;
  } catch (error: any) {
    console.log(JSON.stringify(error.output[1].toString()));
    // Handle any errors that occur during command execution
    console.error(`Error executing command: ${error}`);
    return null;
  }
}
