# Hashicorp Vault Secrets Github Action
## Introduction
Currently, [Hashicorp Vault Secrets](https://developer.hashicorp.com/hcp/docs/vault-secrets) has a direct one-click intergation that links a Github Repo to an app of their choosing. 

However, as highlighted by their [documentation](https://developer.hashicorp.com/hcp/docs/vault-secrets/integrations/github-actions), there are severe limitations, like syncing secrets from a single Hashicorp Cloud Platform project, or syncing to a single organization with the repo. In addition, this integration requires the Hashicorp Vault Secrets App to be installed and configured in your repo, which may not be possible if the repo lives in an organization, and you are not an organization owner/admin. 

This action provides a solution for the aforementioned problems, by using a service principal on your HashiCorp Cloud Platform account, to programmatically access Hashicorp Vault secrets in a Github action runner, and pass them into your workflows.
## Configuring a Service Principal 
### Requirements:
- You must be using an HCP Vault Secrets App
- You must be an HashiCorp Cloud Platform organization Admin or Owner

### Steps:
1. Go [here](https://portal.cloud.hashicorp.com/sign-in) and login
2. Go to your organization
3. Go to **Access Control IAM**. Go to **Service Principals** and create a service principal account
##### Service Princpal Page Example
![Example of Sevice Princpal Landing Page](./images/Service_Principal.png)
## Action Usage
### Quickstart 
```
name: Hashicorp Vault Secrets
id: hashicorp-vault-secrets
uses: aasmal97/HashicorpVaultSecrets@v1.0.0
with: 
    CLIENT_ID: ${{ HASHICORP_CLIENT_ID }}
    CLIENT_SECRET: ${{ secrets.HASHICORP_CLIENT_SECRET }}
    ORGANIZATION_NAME: 'example-org'
    PROJECT_NAME: 'example-project'
    APP_NAME: 'ci-cd-pipeline-app'
    SECRET_NAMES: '["EXAMPLE_ID"]'
```
### Inputs: 
- ##### CLIENT_ID: `string`
  - This is the Organization Service Principal's generated CLIENT_ID acquired from your Hashicorp Portal.
- ##### CLIENT_SECRET: `string` (required)
   - This is the Organization Service Principal's generated CLIENT_SECRET acquired from your Hashicorp Portal.
- ##### ORGANIZATION_NAME: `string` (required)
   - This is the Organization ID or Name that the Service Principal was created on
- ##### PROJECT_NAME: `string` (required)
   - This is the project name that holds the apps where the secrets are stored
- ##### APP_NAME: `string` (required)
   - This is the app name, that holds the secrets 
- ##### SECRET_NAMES: `string` (required)
   - This is **JSON Stringified List** of the secret names you want to extract. 
   - To ensure your list of variables have the correct syntax, pass your array/list through a JSON.stringifier and pass the resulting string in here. 
   - Note: We use `JSON.parse` to parse this string into a list since GitHub Actions does not currently support a list input

- ##### GENERATE_ENV: `string` (optional)
   - The name of the `.env` file that you wish to generate.

### Using Action Output
#### In a Github Action job
To use this action's output is subsequent workflow steps, ensure your `id` from the running action step, is the key to the subsquent step.
##### Example: 
```
steps: 
-   name: Hashicorp Vault Secrets
    id: hashicorp-vault-secrets
    uses: aasmal97/HashicorpVaultSecrets@v1.0.0
    with: 
        CLIENT_ID: ${{ secrets.HASHICORP_CLIENT_ID }}
        CLIENT_SECRET: ${{ secrets.HASHICORP_CLIENT_SECRET }}
        ORGANIZATION_NAME: 'example-org'
        PROJECT_NAME: 'example-project'
        APP_NAME: 'ci-cd-pipeline-app'
        SECRET_NAMES: '["EXAMPLE_ID"]'

-   name: Example Step
    run: echo "The output value is ${{ steps.hashicorp-vault-secrets.outputs.EXAMPLE_ID }}"
```
#### Using a generated .env file 
To use this, you must use the `GENERATE_ENV` input.
```
steps: 
-   name: Hashicorp Vault Secrets
    uses: aasmal97/HashicorpVaultSecrets@v1.0.0
    with: 
        CLIENT_ID: ${{ secrets.HASHICORP_CLIENT_ID }}
        CLIENT_SECRET: ${{ secrets.HASHICORP_CLIENT_SECRET }}
        ORGANIZATION_NAME: 'example-org'
        PROJECT_NAME: 'example-project'
        APP_NAME: 'ci-cd-pipeline-app'
        SECRET_NAMES: '["EXAMPLE_ID"]'
        GENERATE_ENV: "example"

- name: Check if example.env exists
  shell: bash
  run: |
    if test -f /example.env; then
       echo "File exists."
    fi
  
```
## Limitations
- The service principal account must be configured at the **Organization Level**. This a limitation is imposed by Hashicorp themselves, and until this changes, there can't be support for more granular access (i.e service principal for only a project). 
- The `SECRET_NAMES` must be a string since list inputs are not supported by Github Actions. In the future, this may be changed, when Github supports list inputs natively. 
- This action can only run in **Linux**, and has been tested in ubuntu environments. It is not supported in darwin or mac. This is due primarily to ubuntu being the most common environment for Github action runners, but it is also due to my lack of hardware and time. However, in the future, support can be added if it is seen as a good or necessary feature. 
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
