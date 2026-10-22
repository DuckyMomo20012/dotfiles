# devops

One setup file per DevOps tool. Each one installs the tool only when it is
missing (use `--force` to reinstall), then adds shell completion to
`~/.bashrc` / `~/.zshrc` once.

| File                 | Installs         | How                                                           |
| -------------------- | ---------------- | ------------------------------------------------------------- |
| `argocd.setup.ts`    | ArgoCD CLI       | Latest release binary, checksum verified, to `/usr/local/bin` |
| `azure.setup.ts`     | Azure CLI        | Microsoft install script                                      |
| `docker.setup.ts`    | Docker Engine    | Official apt repository, adds you to the `docker` group       |
| `helm.setup.ts`      | Helm + `diff`    | Official install script                                       |
| `helmfile.setup.ts`  | Helmfile         | Latest release binary to `~/.local/bin`                       |
| `k3d.setup.ts`       | k3d              | Official install script                                       |
| `kubectl.setup.ts`   | kubectl          | Stable release, checksum verified, to `/usr/local/bin`        |
| `kustomize.setup.ts` | kustomize        | Official install script (run in a temp directory)             |
| `terraform.setup.ts` | Terraform        | HashiCorp apt repository                                      |

Binaries are downloaded for your CPU (`amd64` or `arm64`) into a temp directory
that is always removed. To run only some of them:
`bun bootstrap.ts --only devops/helm --only devops/kubectl`, or skip one with
`--skip docker`.

> **Note**: Docker needs a new login (or `newgrp docker`) before the group
> change takes effect.
