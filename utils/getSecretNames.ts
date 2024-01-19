import { execSync } from "child_process";
import { findPackageJson } from "./execShellCommand";
import { HashiCorpAuthOptions, HashiCorpConfigOptions } from "../action/types";
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
export const generateSecretsConfigCommand = (
  config: HashiCorpConfigOptions
) => {
  const argumentsArr = [];
  if (config.organizationName)
    argumentsArr.push("--organization", config.organizationName);
  if (config.projectName) argumentsArr.push("--project", config.projectName);
  if (config.appName) argumentsArr.push("--app-name", config.appName);
  const command = argumentsArr.join(" ");
  return command;
};
//This function handles the two versions of this command
// One has secrets, the other secrets list
const getSecrets = (
  auth: HashiCorpAuthOptions,
  config: HashiCorpConfigOptions
) => {
  const packageJsonPath = findPackageJson(__dirname);
  if (!packageJsonPath) return null;
  const configCommand = generateSecretsConfigCommand(config);
  const command = `vlt secrets ${configCommand}`;
  let output = runCommand(command, {
    cwd: packageJsonPath,
    env: {
      HCP_CLIENT_ID: auth.clientId,
      HCP_CLIENT_SECRET: auth.clientSecret,
    },
  });
  if (!output) {
    const command = `vlt secrets list ${configCommand}`;
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
export const getSecretNames = (
  auth: HashiCorpAuthOptions,
  config: HashiCorpConfigOptions
) => {
  const output = getSecrets(auth, config);
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
