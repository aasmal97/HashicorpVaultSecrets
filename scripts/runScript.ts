import { execShellCommand, findPackageJson } from "../utils/execShellCommand";
import { build } from "./buildScript";
import path from "path";
const main = async () => {
  const packageJsonPath = findPackageJson(__dirname);
  if (!packageJsonPath) return console.log("no package.json found");
  //build action.yml file
  await build();
  //test github action
  const testFilePath = path.join("test", "workflows", "test_workflow.yml");
  const secretsFilePath = path.join("test", "workflows", "my.secrets");
  const command = `act -W ${testFilePath} --secret-file ${secretsFilePath}`;
  await execShellCommand(command, {
    cwd: packageJsonPath,
  });
  //test github action all secrets
  const testFileAllSecretsPath = path.join(
    "test",
    "workflows",
    "test_workflow_all_secrets.yml"
  );
  const secretsAllSecretsFilePath = path.join(
    "test",
    "workflows",
    "my.secrets"
  );
  const allSecretsCommand = `act -W ${testFileAllSecretsPath} --secret-file ${secretsAllSecretsFilePath}`;
  await execShellCommand(allSecretsCommand, {
    cwd: packageJsonPath,
  });
};
if (require.main === module) main();
