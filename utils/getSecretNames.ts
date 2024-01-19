import { execSync } from "child_process";
import { findPackageJson } from "./execShellCommand";
import { HashiCorpAuthOptions } from "../action/types";
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
      env: options?.env,
    });
    // Convert the output Buffer to a string and return it
    return outputBuffer.toString();
  } catch (error) {
    // Handle any errors that occur during command execution
    console.error(`Error executing command: ${error}`);
    return null;
  }
}
//This function handles the two versions of this command
// One has secrets, the other secrets list
const getSecrets = (auth: HashiCorpAuthOptions) => {
  const packageJsonPath = findPackageJson(__dirname);
  if (!packageJsonPath) return null;
  const command = `vlt secrets`;
  let output = runCommand(command, {
    cwd: packageJsonPath,
    env: {
      HCP_CLIENT_ID: auth.clientId,
      HCP_CLIENT_SECRET: auth.clientSecret,
    },
  });
  if (!output) {
    const command = `vlt secrets list`;
    output = runCommand(command, {
      cwd: packageJsonPath,
      env: {
        HCP_CLIENT_ID: auth.clientId,
        HCP_CLIENT_SECRET: auth.clientSecret,
      },
    });
    if (!output) return null;
  }
  return output;
};
export const getSecretNames = (auth: {
  clientId: string;
  clientSecret: string;
}) => {
  const output = getSecrets(auth);
  if (!output) return [];
  const lines = output.split("\n");
  const secretNames = lines.slice(1, lines.length).map((line) => {
    const trimmedLine = line.trim();
    const name = trimmedLine.split(/ /g)[0];
    return name;
  });
  const filteredNames = secretNames.filter((name) => name);
  return filteredNames;
};
