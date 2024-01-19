import { execShellCommand } from "../..//utils/execShellCommand";
import * as core from "@actions/core";

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
