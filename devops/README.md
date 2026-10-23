# devops

One setup file per DevOps tool. Each one:

1. installs the tool only when it is missing (`--force` reinstalls),
2. downloads for your CPU (`amd64` or `arm64`) into a temp directory that is
   always removed,
3. adds shell completion to `~/.bashrc` / `~/.zshrc` once (only for shells whose
   rc file exists).

## Tools

| File                 | Tool          | How it is installed                                             | Detected by         |
| -------------------- | ------------- | --------------------------------------------------------------- | ------------------- |
| `argocd.setup.ts`    | ArgoCD CLI    | Latest release binary, SHA-256 verified, to `/usr/local/bin`    | `argocd`            |
| `azure.setup.ts`     | Azure CLI     | Microsoft install script                                        | `az`                |
| `docker.setup.ts`    | Docker Engine | Official apt repository (see below)                             | package `docker-ce` |
| `helm.setup.ts`      | Helm + `diff` | Official `get-helm-3` script, then the `helm-diff` plugin       | `helm`              |
| `helmfile.setup.ts`  | Helmfile      | Latest release binary to `~/.local/bin`                         | `helmfile`          |
| `k3d.setup.ts`       | k3d           | Official install script                                         | `k3d`               |
| `kubectl.setup.ts`   | kubectl       | Stable release, SHA-256 verified, to `/usr/local/bin`           | `kubectl`           |
| `kustomize.setup.ts` | kustomize     | Official install script run in a temp directory, then installed | `kustomize`         |
| `terraform.setup.ts` | Terraform     | HashiCorp apt repository                                        | package `terraform` |

## Run it

```bash
bun bootstrap.ts --only devops                      # all tools
bun bootstrap.ts --only devops --skip docker        # all but docker
bun bootstrap.ts --only devops/kubectl              # one tool
bun devops/helm.setup.ts --dry-run                  # preview one file
bun devops/helm.setup.ts --force                    # reinstall
```

Second run of one file:

```text
$ bun devops/kubectl.setup.ts
Setting up kubectl...
kubectl is already installed, skipping (use --force to reinstall).
Setup kubectl autocompletion
```

## Docker details

- Old or conflicting packages (`docker.io`, `docker-compose`, `podman-docker`,
  `containerd`, `runc`, ...) are removed **only on the first install** and only
  those that are installed. Once `docker-ce` is installed, nothing is touched.
- The repository key and `.list` use your distribution (`ubuntu` or `debian`) and
  the Ubuntu codename from `/etc/os-release`, so Linux Mint and Pop!_OS work.
- Your user is added to the `docker` group once. **Log out and in** (or run
  `newgrp docker`) before using `docker` without `sudo`.

## Terraform details

The HashiCorp repository is used with your release codename when HashiCorp
publishes packages for it, otherwise with `noble`. When the check cannot run
(offline) and a repository file already exists, the file is kept.

## Add a tool

Copy the closest file. A binary release from GitHub (like `helmfile.setup.ts`) is
the most common shape; see the complete example in
[`lib/README.md`](../lib/README.md#complete-example).

## Troubleshooting

- `GitHub API rate limit hit ...` (argocd/helmfile): `export GITHUB_TOKEN=...`.
- `Checksum mismatch for ...`: the download is damaged; run again.
- `docker: permission denied ... docker.sock`: log out and in.
- `kustomize` / `k3d` scripts use `curl | bash`; read the URL in the file if you
  want to review what is run.
