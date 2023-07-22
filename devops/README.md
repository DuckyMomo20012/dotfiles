# devops

This directory will set up DevOps tools.

## Description

File `setup.sh` will find all script files `*.sh` in the `devops` directory and
run it.

Each tool setup file should be named as `<tool>.setup.sh`, for example:
`nodejs.setup.sh` or `python.setup.sh`.

> **Note**: The file `!setup.sh` won't be executed automatically by the file
> `bootstrap.sh`, since it will be ignored (with the `!` prefix).

## Usage

- File `!setup.sh`: Install all the tools.

  - Description:

    - Install all the tools described in this document.

  - Usage:

    ```bash
    ./setup.sh
    ```

- File `argocd.setup.sh`: Instal the ArgoCD CLI.

  - Description:

    - Install the ArgoCD CLI from the official
      [documentation](https://argo-cd.readthedocs.io/en/stable/cli_installation/#download-with-curl).

    - Add the completion script to the `.bashrc` and `.zshrc` files.

  - Usage:

    ```bash
    ./argocd.setup.sh
    ```

- FIle `azure.setup.sh`: Install the Azure CLI.

  - Description:

    - Install the Azure CLI from the official
      [documentation](https://argo-cd.readthedocs.io/en/stable/cli_installation/#download-with-curl).

  - Usage:

    ```bash
    ./azure.setup.sh
    ```

- File `docker.setup.sh`: Install Docker.

  - Description:

    - Install Docker from the official
      [documentation](https://docs.docker.com/engine/install/ubuntu/).

    - Install Docker as a non-root user from the official
      [documentation](https://docs.docker.com/engine/install/linux-postinstall/).

  - Usage:

    ```bash
    ./docker.setup.sh
    ```

- File `helm.setup.sh`: Install Helm.

  - Description:

    - Install Helm from the official
      [documentation](https://helm.sh/docs/intro/install/).

    - Add the completion script to the `.bashrc` and `.zshrc` files.

  - Usage:

    ```bash
    ./helm.setup.sh
    ```

- File `helmfile.setup.sh`: Install Helmfile.

  - Description:

    - Install Helmfile from the official
      [documentation](https://helmfile.readthedocs.io/en/latest/#installation).

    - Add the completion script to the `.bashrc` and `.zshrc` files.

  - Usage:

    ```bash
    ./helmfile.setup.sh
    ```

- File `k3d.setup.sh`: Install k3d.

  - Description:

    - Install k3d from the official
      [documentation](https://k3d.io/#installation).

    - Add the completion script to the `.bashrc` and `.zshrc` files.

  - Usage:

    ```bash
    ./k3d.setup.sh
    ```

- File `kubectl.setup.sh`: Install kubectl.

  - Description:

    - Install kubectl from the official
      [documentation](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/).

    - Add the completion script to the `.bashrc` and `.zshrc` files.

  - Usage:

    ```bash
    ./kubectl.setup.sh
    ```

- File `kustomize.setup.sh`: Install kustomize.

  - Description:

    - Install kustomize from the official
      [documentation](https://kubectl.docs.kubernetes.io/installation/kustomize/binaries/).

    - Add the completion script to the `.bashrc` and `.zshrc` files.

  - Usage:

    ```bash
    ./kustomize.setup.sh
    ```

- File `terraform.setup.sh`: Install Terraform.

  - Description:

    - Install Terraform from the official
      [documentation](https://learn.hashicorp.com/tutorials/terraform/install-cli).

    - Add the completion script to the `.bashrc` and `.zshrc` files.

  - Usage:

    ```bash
    ./terraform.setup.sh
    ```
