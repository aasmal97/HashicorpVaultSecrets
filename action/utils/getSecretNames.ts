import { findPackageJson } from "../../utils/execShellCommand";
import { runCommand } from "./runCommand";
import * as core from "@actions/core";
import { HashiCorpAuthOptions, HashiCorpConfigOptions } from "../types";
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export const generateSecretsConfigCommand = (
  config: HashiCorpConfigOptions
) => {
  const argumentsArr = [];
  if (config.appName) argumentsArr.push("--app", config.appName);
  const command = argumentsArr.join(" ");
  return command;
};
const getSecrets = (
  auth: HashiCorpAuthOptions,
  config: HashiCorpConfigOptions
) => {
  const packageJsonPath = findPackageJson(__dirname);
  if (!packageJsonPath) return null;
  const configCommand = generateSecretsConfigCommand(config);
  const command = `hcp vault-secrets secrets list ${configCommand}`;
  const output = runCommand(`${command}`, {
    cwd: packageJsonPath,
    requireAuth: {
      HCP_PROJECT_ID: config.projectName,
      HCP_ORGANIZATION_ID: config.organizationName,
      HCP_CLIENT_ID: auth.clientId,
      HCP_CLIENT_SECRET: auth.clientSecret,
    },
  });
  if (!output) return null;
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
const generateSecretsMap = ({
  auth,
  config,
}: {
  auth: HashiCorpAuthOptions;
  config: HashiCorpConfigOptions;
}) => {
  const secretsList = getSecretNames(auth, config);
  const secretsMap = Object.assign(
    {},
    ...secretsList.map((name) => ({ [name]: null }))
  );
  core.info("Secrets Map Generated");
  return secretsMap;
};
const extractSecretsInList = async ({
  secretNames,
  secretsMap,
  auth,
  config,
  configCommand,
}: {
  config: HashiCorpConfigOptions;
  secretNames: string[];
  secretsMap: { [key: string]: string };
  auth: HashiCorpAuthOptions;
  configCommand: string;
}): Promise<[string, { [key: string]: string }]> => {
  const contentArrPromise: Promise<
    [{ [key: string]: string }, string] | null
  >[] = [];
  for (let name of secretNames) {
    //we have this delay so we don't exceed our rate limit of 5-10 requests per second
    await delay(200);
    const getSecret = async (): Promise<
      [{ [key: string]: string }, string] | null
    > => {
      if (!(name in secretsMap)) return null;
      const value = runCommand(
        `hcp vault-secrets secrets open ${name} --format=json ${configCommand}`,
        {
          requireAuth: {
            HCP_PROJECT_ID: config.projectName,
            HCP_ORGANIZATION_ID: config.organizationName,
            HCP_CLIENT_ID: auth.clientId,
            HCP_CLIENT_SECRET: auth.clientSecret,
          },
        }
      );
      if (!value) return null;
      const secretsJson = JSON.parse(value);
      const newValue =
        secretsJson.static_version?.value ||
        secretsJson.auto_rotating?.value ||
        secretsJson.auto_rotating_version?.value;
      return [{ [name]: newValue }, name + "=" + `"${newValue}"\n`];
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
  const content = filteredContentArr.reduce((a, b) => a + b[1], "");
  const lineMap = filteredContentArr.reduce((a, b) => ({ ...a, ...b[0] }), {});
  return [content, lineMap];
};
export const extractSecrets = async ({
  secretNames,
  auth,
  config,
  allSecrets,
}: {
  secretNames?: string[];
  allSecrets?: boolean;
  config: HashiCorpConfigOptions;
  auth: HashiCorpAuthOptions;
}): Promise<[string, { [key: string]: string }]> => {
  const secretsMap = generateSecretsMap({ config, auth });
  const configCommand = generateSecretsConfigCommand(config);
  const currSecretNames = allSecrets
    ? Object.keys(secretsMap)
    : secretNames || [];
  return await extractSecretsInList({
    secretNames: currSecretNames,
    config,
    secretsMap,
    auth,
    configCommand,
  });
};
