import * as core from "@actions/core";
import { execShellCommand } from "../utils/execShellCommand";
import { generateEnvFile } from "../utils/generateEnv";
import { getSecretNames, runCommand } from "../utils/getSecretNames";
import { HashiCorpAuthOptions } from "./types";
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
export const getInputs = () => {
  core.info("Getting Inputs");
  const clientId = core.getInput("CLIENT_ID");
  const clientSecret = core.getInput("CLIENT_SECRET");
  const projectName = core.getInput("PROJECT_NAME");
  const appName = core.getInput("APP_NAME");
  const secretsNames = JSON.parse(core.getInput("SECRET_NAMES")) as string[];
  const generateEnv = core.getInput("GENERATE_ENV");
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
    await execShellCommand("vlt --version");
    core.info("HashiCorp Vault Installed");
  } catch (error) {
    core.error(JSON.stringify(error));
  }
};
const generateSecretsMap = (auth: HashiCorpAuthOptions) => {
  const secretsList = getSecretNames(auth);
  const secretsMap = Object.assign(
    {},
    ...secretsList.map((name) => ({ [name]: null }))
  );
  core.info("Secrets Map Generated");
  return secretsMap;
};
export const extractSecrets = async (
  secretNames: string[],
  auth: {
    clientId: string;
    clientSecret: string;
  }
): Promise<[string, { [key: string]: string }]> => {
  const secretsMap = generateSecretsMap(auth);
  const contentArrPromise: Promise<
    [{ [key: string]: string }, string] | null
  >[] = [];
  for (let name of secretNames) {
    await delay(200);
    const getSecret = async (): Promise<
      [{ [key: string]: string }, string] | null
    > => {
      if (!(name in secretsMap)) return null;
      //we have this delay so we don't exceed our rate limit of 5-10 requests per second
      const value = runCommand(`vlt secrets get --plaintext ${name}`, {
        env: {
          HCP_CLIENT_ID: auth.clientId,
          HCP_CLIENT_SECRET: auth.clientSecret,
        },
      });
      if (!value) return null;
      return [
        { [name]: value.replace("\n", "") },
        name + "=" + `"${value.replace("\n", "")}"\n`,
      ];
    };
    contentArrPromise.push(getSecret());
  }
  const contentArr = await Promise.all(contentArrPromise);
  //log all errors from secrets
  contentArr.forEach((val, idx) => {
    if (!val) core.info(`Error getting secret ${secretNames[idx]}`);
  });
  const filteredContentArr = contentArr.filter((val) => val) as [
    { [key: string]: string },
    string
  ][];
  if (filteredContentArr.length === 0) return ["", {}];
  const content = filteredContentArr.reduce((a, b) => a[1] + b[1], "");
  const lineMap = filteredContentArr.reduce(
    (a, b) => ({ ...a[0], ...b[0] }),
    {}
  );
  return [content, lineMap];
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
  const [content, output] = await extractSecrets(secretsNames, {
    clientId,
    clientSecret,
  });
  if (generateEnv) generateEnvFile(generateEnv, content);
  core.info("Finished secrets generation");
  core.setOutput("secrets", output);
};
main();
