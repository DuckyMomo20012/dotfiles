<div align="center">

  <h1>dotfiles</h1>

  <p>
    My custom dotfiles for Linux
  </p>

<!-- Badges -->
<p>
  <a href="https://github.com/DuckyMomo20012/dotfiles/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/DuckyMomo20012/dotfiles" alt="contributors" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/last-commit/DuckyMomo20012/dotfiles" alt="last update" />
  </a>
  <a href="https://github.com/DuckyMomo20012/dotfiles/network/members">
    <img src="https://img.shields.io/github/forks/DuckyMomo20012/dotfiles" alt="forks" />
  </a>
  <a href="https://github.com/DuckyMomo20012/dotfiles/stargazers">
    <img src="https://img.shields.io/github/stars/DuckyMomo20012/dotfiles" alt="stars" />
  </a>
  <a href="https://github.com/DuckyMomo20012/dotfiles/issues/">
    <img src="https://img.shields.io/github/issues/DuckyMomo20012/dotfiles" alt="open issues" />
  </a>
  <a href="https://github.com/DuckyMomo20012/dotfiles/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/DuckyMomo20012/dotfiles.svg" alt="license" />
  </a>
</p>

<h4>
    <a href="https://github.com/DuckyMomo20012/dotfiles/">View Demo</a>
  <span> · </span>
    <a href="https://github.com/DuckyMomo20012/dotfiles">Documentation</a>
  <span> · </span>
    <a href="https://github.com/DuckyMomo20012/dotfiles/issues/">Report Bug</a>
  <span> · </span>
    <a href="https://github.com/DuckyMomo20012/dotfiles/issues/">Request Feature</a>
  </h4>
</div>

<br />

<!-- Table of Contents -->

# :notebook_with_decorative_cover: Table of Contents

- [About the Project](#star2-about-the-project)
  - [Features](#dart-features)
- [Getting Started](#toolbox-getting-started)
  - [Prerequisites](#bangbang-prerequisites)
  - [Run Locally](#running-run-locally)
- [Usage](#eyes-usage)
  - [Project Structure](#card_index_dividers-project-structure)
  - [Fresh Machine Setup](#beverage_box-fresh-machine-setup)
- [Roadmap](#compass-roadmap)
- [Contributing](#wave-contributing)
  - [Code of Conduct](#scroll-code-of-conduct)
- [FAQ](#grey_question-faq)
- [License](#warning-license)
- [Contact](#handshake-contact)
- [Acknowledgements](#gem-acknowledgements)

<!-- About the Project -->

## :star2: About the Project

<!-- Features -->

### :dart: Features

> **Warning**: Use at your own risk. Please acknowledge for what you are copying
> and what you are using it for.

- Easy to install packages.
- Secure your dotfiles in the `private` folder.
- Easy to add your specific tools.

<!-- Getting Started -->

## :toolbox: Getting Started

<!-- Prerequisites -->

### :bangbang: Prerequisites

- `Git` should be installed on your system:

  ```bash
  sudo apt-get install git
  ```

- **Bash shell support**.

<!-- Run Locally -->

### :running: Run Locally

- **Run from script**:

  File `install.sh` will clone this repository in `~/dotfiles` and run
  `bootstrap.sh` to install all packages and dotfiles.

  ```bash
  curl -sSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -
  ```

- **Run manually**:

  Clone the project:

  ```bash
  git clone https://github.com/DuckyMomo20012/dotfiles.git
  ```

  Go to the project directory:

  ```bash
  cd dotfiles
  ```

  Run the bootstrap script:

  ```bash
  ./bootstrap.sh
  ```

<!-- Usage -->

## :eyes: Usage

> **Note**: This project is tested on Ubuntu 22.04.1 LTS and Ubuntu 22.10.

File `bootstrap.sh` will find all `setup.sh` files in **all directories** and
run it. But before that, it will run `setup.sh` in the `packages` directory, to
make sure all dependency packages are installed.

### :card_index_dividers: Project Structure:

- [`asdf`](./asdf/): Setup the `asdf` tool version manager and install plugins.
- [`completions`](./completions/): Setup `bash` completions.
- [`crontab`](./crontab/): Setup cron jobs.
- [`docker`](./docker/): Setup `docker` and `docker-compose`.
- [`dotfiles`](./dotfiles/): Setup dotfiles.
- [`gpg`](./gpg/): Scripts to encrypt files in the `private` directory or
  export/import `gpg` keys.
- [`ibus-bamboo`](./ibus-bamboo/): Setup `ibus-bamboo` Vietnamese input method.
- [`misc`](./misc/): Miscellaneous scripts.
- [`packages`](./packages/): Install packages.
- [`poetry`](./poetry/): Setup `poetry` Python package manager.
- [`private`](./private/): Private dotfiles, will be ignored and encrypted.
  - [`private/dotfiles-example`](./private/dotfiles-example): Example private
    dotfiles configuration.
- [`utils`](./utils/): Utility scripts for this project.

Each directory will have a `README.md` file to explain what it does and how to
customize.

### :beverage_box: Fresh Machine Setup:

Assume your current directory has this structure:

```
.
├── Other packages
│   └── zoom_amd64.deb
├── bootstrap.sh
├── google-chrome-stable_current_amd64.deb
└── secret.asc
```

Then the code below will do the following:

- Install `.deb` packages in the top-level directory, but other packages in a
  nested directory, e.g. `Other packages` won't be installed.
- Download the file `install.sh` from this repository and run it.
- Import the secret key from the `secret.asc` file.
- Decrypt the `private` directory.

> **Note**: `secret.asc` file should be a secret key file, not a public key
> file.

> **Note**: Please replace `<YOUR-PASSWORD>` with your passphrase, or you can
> remove it and enter your passphrase when prompted.

Every step is run seamlessly without any prompts, so you won't have any
interruptions during running the script.

```bash
#!/usr/bin/env bash

curr_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$curr_dir"

mkdir -p "/tmp/packages/"

find * -maxdepth 0 -name "*.deb" -type f | while read package; do
    cp "$curr_dir/$package" "/tmp/packages"

    sudo apt install -y "/tmp/packages/$package"
done

rm -rf "/tmp/packages/"

sudo apt-get install -y curl git

curl -sSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -

$HOME/dotfiles/gpg/import.sh -f "$curr_dir/secret.asc"

$HOME/dotfiles/gpg/dedot.sh -p "<YOUR-PASSWORD>"

```

<!-- Roadmap -->

## :compass: Roadmap

- [x] Colorize output.

<!-- Contributing -->

## :wave: Contributing

<a href="https://github.com/DuckyMomo20012/dotfiles/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=DuckyMomo20012/dotfiles" />
</a>

Contributions are always welcome!

<!-- Code of Conduct -->

### :scroll: Code of Conduct

Please read the
[Code of Conduct](https://github.com/DuckyMomo20012/dotfiles/blob/main/CODE_OF_CONDUCT.md).

<!-- FAQ -->

## :grey_question: FAQ

- Is this project still maintained?

  - Yes, I will add more dotfiles when I use new tools or have some
    modifications to my current dotfiles.

- Is this project support other Linux distributions or MacOS?

  - I don't know, because I don't have time to test it, so some scripts may not
    work on other distributions. But you can try it and let me know if it works.

<!-- License -->

## :warning: License

Distributed under MIT license. See
[LICENSE](https://github.com/DuckyMomo20012/dotfiles/blob/main/LICENSE) for more
information.

<!-- Contact -->

## :handshake: Contact

Duong Vinh - [@duckymomo20012](https://twitter.com/duckymomo20012) -
tienvinh.duong4@gmail.com

Project Link:
[https://github.com/DuckyMomo20012/dotfiles](https://github.com/DuckyMomo20012/dotfiles).

<!-- Acknowledgments -->

## :gem: Acknowledgements

Here are useful resources and libraries that I have used in my projects:

- [Awesome Readme Template](https://github.com/Louis3797/awesome-readme-template):
  A detailed template to bootstrap your README file quickly.

- [rkalis/dotfiles](https://github.com/rkalis/dotfiles): A good dotfiles project
  that inspired me with the keep sudo alive approach, extract install command
  from file name and some other things.

- [holman/dotfiles](https://github.com/holman/dotfiles): Good folder structure
  and symlink approach.

- [explainshell.com](https://explainshell.com/): A website to explain shell
  commands.

- [ShellCheck](https://www.shellcheck.net/): Finds bugs in your shell scripts.

<!-- Ref: https://stackoverflow.com/questions/9725675/is-there-a-standard-format-for-command-line-shell-help-text -->

- [DOCOPT](http://docopt.org/): Command-line interface description language.
