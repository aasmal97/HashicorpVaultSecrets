import * as core from "@actions/core";
import { generateEnvFile } from "../utils/generateEnv";
import { extractSecrets } from "./utils/getSecretNames";
import { installHashiCorp } from "./utils/installHashiCorp";
import { z } from "zod";
export const ActionSchema = z.object({
  clientId: z.string({
    required_error: "CLIENT_ID is required",
    invalid_type_error: "CLIENT_ID must be a string",
  }),
  clientSecret: z.string({
    required_error: "CLIENT_SECRET is required",
    invalid_type_error: "CLIENT_SECRET must be a string",
  }),
  organizationName: z.string({
    required_error: "ORGANIZATION_ID is required",
    invalid_type_error: "ORGANIZATION_ID must be a string",
  }),
  projectName: z.string({
    required_error: "PROJECT_ID is required",
    invalid_type_error: "PROJECT_ID must be a string",
  }),
  appName: z.string({
    required_error: "APP_NAME is required",
    invalid_type_error: "APP_NAME must be a string",
  }),
  secretsNames: z
    .string({
      invalid_type_error: "SECRET_NAMES must be a JSON Stringified Array",
    })
    .or(z.array(z.string()))
    .optional()
    .transform((val) => {
      if (typeof val === "string") return JSON.parse(val) as string[];
      return val;
    }),
  generateEnv: z
    .string({ invalid_type_error: "GENERATE_ENV must be a string" })
    .optional()
    .transform((val) => {
      if (!val) return;
      const hasExtension = val.split(".").length >= 2;
      if (hasExtension) return val;
      else return `${val}.env`;
    }),
  allSecrets: z
    .boolean()
    .or(z.string())
    .optional()
    .default(false)
    .transform((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val === "true";
      return false;
    }),
});
export type ActionSchemaType = z.infer<typeof ActionSchema>;
export const getInputs = () => {
  core.info("Getting Inputs");
  const clientId = core.getInput("CLIENT_ID");
  const clientSecret = core.getInput("CLIENT_SECRET");
  const organizationName = core.getInput("ORGANIZATION_ID");
  const projectName = core.getInput("PROJECT_ID");
  const appName = core.getInput("APP_NAME");
  const secretsNames = core.getInput("SECRET_NAMES");
  const generateEnv = core.getInput("GENERATE_ENV");
  const allSecrets = core.getInput("ALL_SECRETS");
  const data = {
    clientId,
    clientSecret,
    projectName,
    appName,
    secretsNames,
    generateEnv,
    organizationName,
    allSecrets,
  };
  const paramsValidationResult = ActionSchema.safeParse(data);
  if (!paramsValidationResult.success) {
    core.setFailed(paramsValidationResult.error.message);
    return new Error(paramsValidationResult.error.message);
  }
  core.info("Inputs Parsed");
  return paramsValidationResult.data;
};

export const main = async () => {
  const inputs = getInputs();
  if (inputs instanceof Error) return;
  const {
    clientId,
    clientSecret,
    projectName,
    appName,
    secretsNames,
    generateEnv,
    organizationName,
    allSecrets,
  } = inputs;
  installHashiCorp({
    clientId,
    clientSecret,
  });
  const [content, output] = await extractSecrets({
    secretNames: secretsNames,
    allSecrets,
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
