import { HashiCorpAuthOptions } from "../types";
import { runCommand } from "./runCommand";
import * as core from "@actions/core";
export const installHashiCorpCommands = [
  // "sudo apt update",
  // //install lsb-release
  // "sudo apt-get update && apt-get install -y lsb-release",
  // //retrive key
  // "curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg",
  // //install vlt
  // `echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list`,
  // "sudo apt update",
  // "sudo apt install vlt -y",
  // "vlt --version",
  "sudo apt-get update && \
  sudo apt-get install wget gpg coreutils",
  "wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg",
  `echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list`,
  "sudo apt-get update && sudo apt-get install hcp",
  "hcp version"
];
export const installHashiCorp = (auth: HashiCorpAuthOptions) => {
  core.info("Installing HashiCorp Vault");
  try {
    runCommand(installHashiCorpCommands.join(";"), {
      env: {
        HCP_CLIENT_ID: auth.clientId,
        HCP_CLIENT_SECRET: auth.clientSecret,
      },
    });
    core.info("HashiCorp Vault Installed");
  } catch (error) {
    core.error(JSON.stringify(error));
  }
};
