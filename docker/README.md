# docker

This directory will set up the `docker` with `docker-engine` and
`docker-compose`.

## Getting Started

First, the file `!setup.sh` will install `docker` following the
[official guide](https://docs.docker.com/engine/install/ubuntu/) for Ubuntu.

> **Warning**: This script will also add the current user to the `docker` group
> for a
> [**non-root user to run `docker` commands**](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user).

You can also install [`k3d`](https://k3d.io/stable/) kubernetes cluster with the
`-k` option.

> **Note**: The file `!setup.sh` won't be executed automatically, since it will
> be ignored (with the `!` prefix) by the file `bootstrap.sh`.

## Usage

- File `!setup.sh`: Setup docker.

  - Description:

    - Setup `docker` with `docker-engine` and `docker-compose`.
    - Setup `k3d` kubernetes cluster.
    - Setup `kubectl` kubernetes command-line tool and bash completion for
      `kubectl`.

  - Usage:

    ```
    ./!setup.sh [-k | -h]
    ```

    Options:

    - `-k` (k3d): Setup `k3d` kubernetes cluster.
    - `-h` (help): Show help message.

- File `docker.setup.sh`: Setup docker.

  - Description:

    - Setup `docker` with `docker-engine` and `docker-compose`.

  - Usage:

    ```
    ./docker.setup.sh
    ```

- File `k3d.setup.sh`: Setup `k3d` kubernetes cluster.

  - Description:

    - Setup `k3d` kubernetes cluster.

    > **Note**: This script won't create a cluster automatically, you need to
    > manually create a cluster with the command `k3d cluster create mycluster`.

  - Usage:

    ```
    ./k3d.setup.sh
    ```

- File `kubectl.setup.sh`: Setup `kubectl` kubernetes command-line tool.

  - Description:

    - Setup `kubectl` kubernetes command-line tool.

    > **Note**: After installation, when you run the command
    > `kubectl cluster-info`, you may see an error since the `k3d` cluster is
    > not created yet.

  - Usage:

    ```
    ./kubectl.setup.sh
    ```

- File `terraform.setup.sh`: Setup `terraform` command-line tool.

  - Description:

    - Setup `terraform` command-line tool.

  - Usage:

    ```
    ./terraform.setup.sh
    ```
