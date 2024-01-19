import * as core from "@actions/core";
import { execShellCommand } from "../utils/execShellCommand";
export const getInputs = () => {
  core.info("Getting Inputs");
  const clientId = core.getInput("CLIENT_ID");
  const clientSecret = core.getInput("CLIENT_SECRET");
  const projectName = core.getInput("PROJECT_NAME");
  const appName = core.getInput("APP_NAME");
  const secretsNames = JSON.parse(core.getInput("SECRET_NAMES")) as string[];
  const generateEnv = new Boolean(core.getInput("GENERATE_ENV"));
  core.info("Inputs Parsed");
  return {
    clientId,
    clientSecret,
    projectName,
    appName,
    secretsNames,
    generateEnv,
  };
};
export const installHashiCorp = async () => {
  core.info("Installing HashiCorp Vault");
  try {
    await execShellCommand("sudo apt update");
    //install lsb-release
    await execShellCommand("apt-get update && apt-get install -y lsb-release");
    await execShellCommand(
      "curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg"
    );
    await execShellCommand(
      `echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list`
    );
    await execShellCommand("sudo apt update");
    await execShellCommand("sudo apt install vlt -y");
    await execShellCommand("vlt");
    core.info("HashiCorp Vault Installed");
  } catch (error) {
    core.error(JSON.stringify(error));
  }
};
export const authenticateHashiCorp = async (
  clientId: string,
  clientSecret: string
) => {
  core.info("Attempting to Authenticate HashiCorp Vault");
  try {
    await execShellCommand(`export HCP_CLIENT_ID=${clientId}`);
    await execShellCommand(`export HCP_CLIENT_SECRET=${clientSecret}`);
    core.info("HashiCorp Vault Authenticated");
  } catch (error) {
    core.error(JSON.stringify(error));
  }
};
export const main = async () => {
  await installHashiCorp();
  const inputs = getInputs();
  const {
    clientId,
    clientSecret,
    projectName,
    appName,
    secretsNames,
    generateEnv,
  } = inputs;
  await authenticateHashiCorp(clientId, clientSecret);
};

main();
