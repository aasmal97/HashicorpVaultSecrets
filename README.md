# Hashicorp Vault Secrets Github Action
## Introduction
Currently, Hashicorp Vault Secrets has a direct one-click intergation that links a Github Repo to an app of their choosing. 

However, as highlighted by their [documentation](https://developer.hashicorp.com/hcp/docs/vault-secrets/integrations/github-actions), there are severe limitations, like syncing secrets from a single HCP project, or syncing to a single organization with the repo. In addition, this integration requires the Hashicorp Vault Secrets App to be installed and configured in your repo, which may not be possible if the repo lives in an organization, and you are not an organization owner/admin. 

This action provides a solution for the aforementioned problems, by using a service principal on your HashiCorp Organization account, to programmatically access Hashicorp Vault secrets in a Github action runner, and pass them into your workflows.
## Using this Action
### Running the Action
```
name: Hashicorp Vault Secrets
id: hashicorp-vault-secrets
uses: aasmal97/HashicorpVaultSecrets@v1.1
with: 
  CLIENT_ID: '${{ HASHICORP_CLIENT_ID }}'
  CLIENT_SECRET: '${{ secrets.HASHICORP_CLIENT_SECRET }}'
  PROJECT_NAME: 'example-project'
  APP_NAME: 'ci-cd-pipeline-app'
```
### Using the Action Output
#### In a Github action job
To use this action's output is subsequent workflow steps, ensure your `id` from the running action step, is the key to the subsquent step.
##### Example: 
```
steps: 
-   name: Hashicorp Vault Secrets
    id: hashicorp-vault-secrets
    uses: aasmal97/HashicorpVaultSecrets@v1.1
    with: 
        CLIENT_ID: '${{ HASHICORP_CLIENT_ID }}'
        CLIENT_SECRET: '${{ secrets.HASHICORP_CLIENT_SECRET }}'
        PROJECT_NAME: 'example-project'
        APP_NAME: 'ci-cd-pipeline-app'
        SECRET_NAMES: ["EXAMPLE_ID"]

-   name: Example Step
    run: echo "The output value is ${{ steps.hashicorp-vault-secrets.outputs.secrets }}"
```
#### Using a generated .env file 

## Contributing
Anyone is welcome to contribute, simply open an issue or pull request. When opening an issue, ensure you can reproduce the issue, and list the steps you took to reproduce it.

### Development Environment
To run the development environment, ensure the following are configured properly, and your are running the appropiate commands.  
#### Requirements
- [Docker](https://docs.docker.com/engine/install/) installed on your machine. It will provide the virtual environment needed to run a Github Action
- [nektos/act](https://github.com/nektos/act) installed. This is the software that converts a Docker Environment into a Github Action Environment for testing 
- Have a package manager installed (i.e, npm, yarn, etc)
- Create a Hashicorp Cloud Platform Account
    1. Go [here](https://portal.cloud.hashicorp.com/sign-in) and create an account
    2. Create a dummy organization
    3. Go an **Access Control IAM**. Go to **Service Principals** and create a dummy service principal account
        - **Save** the ***Client ID*** and ***Client Secret*** values in a `my.secrets` file in the following path `test/workflows/my.secrets`. `nektos/act` will use this to run the virtual github action.
        - Note: The `my.secrets` file follows the same form/syntax as a regular `.env` file.
    4. Create a dummy project in your organization
    5. Click on newly created dummy project, and go to **Vault Secrets**
    6. Go to **Applications** and create a dummy application
    8. Fill in the dummy application with dummy secrets

#### Running Dev Environment
1. Run `npm i`
2. Run `npm run dev`
