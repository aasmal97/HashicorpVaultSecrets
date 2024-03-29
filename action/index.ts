import * as core from "@actions/core";
import { generateEnvFile } from "../utils/generateEnv";
import { extractSecrets } from "./utils/getSecretNames";
import { installHashiCorp } from "./utils/installHashiCorp";
export const getInputs = () => {
  core.info("Getting Inputs");
  const clientId = core.getInput("CLIENT_ID");
  const clientSecret = core.getInput("CLIENT_SECRET");
  const organizationName = core.getInput("ORGANIZATION_NAME");
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
    organizationName,
  };
};

export const main = async () => {
  const inputs = getInputs();
  const {
    clientId,
    clientSecret,
    projectName,
    appName,
    secretsNames,
    generateEnv,
    organizationName,
  } = inputs;
  installHashiCorp({
    clientId,
    clientSecret,
  });
  const [content, output] = await extractSecrets({
    secretNames: secretsNames,
    config: {
      appName,
      projectName,
      organizationName,
    },
    auth: {
      clientId,
      clientSecret,
    },
  });
  core.info("Finished secrets generation");
  Object.keys(output).forEach((key) => {
    //mask the value
    core.setSecret(output[key]);
    //set output
    core.setOutput(key, output[key]);
  });
  if (generateEnv) generateEnvFile(generateEnv, content);
};
main();
