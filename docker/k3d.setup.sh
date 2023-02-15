#!/usr/bin/env bash

curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
