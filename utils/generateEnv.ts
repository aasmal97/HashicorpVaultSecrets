import fs from "fs";
import { execSync } from "child_process";
import { execShellCommand, findPackageJson } from "./execShellCommand";
function runCommand(command: string, cwd?: string): string | null {
  try {
    // Run the command and store the output as a Buffer
    const outputBuffer = execSync(command, { cwd: cwd });
    // Convert the output Buffer to a string and return it
    return outputBuffer.toString();
  } catch (error) {
    // Handle any errors that occur during command execution
    console.error(`Error executing command: ${error}`);
    return null;
  }
}
function generateEnvFile(envFileName: string, envContent: string) {
  try {
    fs.writeFileSync(".env.local", envContent.trim());
    console.log(".env.local file generated successfully!");
  } catch (error) {
    console.error(`Error generating .env file: ${error}`);
  }
}
//This function handles the two versions of this command
// One has secrets, the other secrets list
const getSecrets = () => {
  const packageJsonPath = findPackageJson(__dirname);
  if (!packageJsonPath) return null;
  const command = `vlt secrets`;
  let output = runCommand(command, packageJsonPath);
  if (!output) {
    const command = `vlt secrets list`;
    output = runCommand(command, packageJsonPath);
    if (!output) return null;
  }
  return output;
};
export const getSecretNames = () => {
  const output = getSecrets();
  if (!output) return "";
  const lines = output.split("\n");
  const secretNames = lines.slice(1, lines.length).map((line) => {
    const trimmedLine = line.trim();
    const name = trimmedLine.split(/ /g)[0];
    return name;
  });
  const filteredNames = secretNames.filter((name) => name);
  return filteredNames;
};
