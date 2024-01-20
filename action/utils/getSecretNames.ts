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
  if (config.organizationName)
    argumentsArr.push("--organization", config.organizationName);
  if (config.projectName) argumentsArr.push("--project", config.projectName);
  if (config.appName) argumentsArr.push("--app-name", config.appName);
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
  const command = `vlt secrets list ${configCommand}`;
  const output = runCommand(command, {
    cwd: packageJsonPath,
    env: {
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
export const extractSecrets = async ({
  secretNames,
  auth,
  config,
}: {
  secretNames: string[];
  config: HashiCorpConfigOptions;
  auth: HashiCorpAuthOptions;
}): Promise<[string, { [key: string]: string }]> => {
  const secretsMap = generateSecretsMap({ config, auth });
  const configCommand = generateSecretsConfigCommand(config);
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
        `vlt secrets get ${configCommand} --plaintext ${name}`,
        {
          env: {
            HCP_CLIENT_ID: auth.clientId,
            HCP_CLIENT_SECRET: auth.clientSecret,
          },
        }
      );
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
  const lineMap = filteredContentArr.reduce((a, b) => ({ ...a, ...b[0] }), {});
  return [content, lineMap];
};
