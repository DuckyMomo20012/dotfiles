#!/usr/bin/env bash

info() {
    msg="$1";

    tput bold;
    tput setaf "6"; # foreground cyan
    tput setab "7"; # background white
    echo "$msg";
    tput sgr0; # turn off all attributes
    tput el; # Fix background color trailing problem
}

success() {
    msg="$1";

    tput bold;
    tput setaf "2"; # foreground green
    tput setab "7"; # background white
    echo "$msg";
    tput sgr0;
    tput el;
}

warn() {
    msg="$1";

    tput bold;
    tput setaf "3"; # foreground yellow
    tput setab "7"; # background white
    echo "$msg";
    tput sgr0;
    tput el;
}

error() {
    msg="$1";

    tput bold;
    tput setaf "1"; # foreground cyan
    tput setab "7"; # background white
    echo "$msg";
    tput sgr0;
    tput el;
}

pushLineNonDup() {
    line="$1"
    file="$2"

    if [[ ! -f "$file" ]]; then
        echo "" >> "$file"
    fi

    # Append line to file
    if ! grep -Fxq "$line" "$file"; then
        echo "$line" >> "$file"
    fi
}

startsudo() {
    if sudo -v; then
        success "Sudo credentials updated."
        # Start process to keep sudo alive
        # Ref: https://stackoverflow.com/a/30547074/12512981
        ( while true; do sudo -v; sleep 50; done; ) &

        # NOTE: We have to use $! to get the PID of the last background process,
        # so we can kill it later
        SUDO_PID="$!"
        trap stopsudo INT TERM
    else
        error "Failed to obtain sudo credentials."

        return 1
    fi

    return 0
}

stopsudo() {
    # Check if SUDO_PID is not empty
    if [[ -n "$SUDO_PID" ]]; then
        kill -9 "$SUDO_PID"

        # Suppress "Killed" message
        # Ref: https://stackoverflow.com/a/5722874/12512981
        wait "$SUDO_PID" 2>/dev/null
        trap - INT TERM
        # Unvalidate sudo credentials
        sudo -k

        # Unset so we don't kill it again
        unset SUDO_PID
    fi

    return 0
}

symlink() {
    src="$1"
    dst="$2"

    # Default to backup existing files
    action="${3:-B}"

    backup_dst="$HOME/.dotfiles_backup"


    if [[ -f "$dst" || -d "$dst" || -L "$dst" ]]; then

        case "$action" in
          O )
            overwrite_all=true
            ;;

          B )
            backup_all=true
            ;;

          S )
            skip_all=true
            ;;

          * )
            error "Invalid action: $action"
            return 1
            ;;
        esac

        # Overwrite existing file
        if [[ "$overwrite_all" == "true" ]]; then
            rm -rf "$dst"
            info "Removed \"$dst\""
        fi

        # Backup existing file then overwrite
        if [[ "$backup_all" == "true" ]]; then
            mkdir -p "$backup_dst"

            # Remove previous backup to prevent nested backup problem
            rm -rf "$backup_dst/$(basename "$dst")"

            mv "$dst" "${backup_dst}/$(basename "$dst")"
            info "Moved \"$dst\" to \""${backup_dst}/$(basename "$dst")"\""
        fi
    fi

    # Skip existing file
    if [[ "$skip_all" == "true" ]]; then
        info "Skipped \"$dst\""
    else
        # Symbolic link
        ln -s "$src" "$dst"
        info "Linked \"$src\" to \"$dst\""
    fi
}

installDotFiles() {
    # NOTE: dotfiles_dir should be absolute path
    dotfiles_dir="$1"

    action="$2"

    cd "$dotfiles_dir"

    info "Installing dotfiles in \"$dotfiles_dir\"..."

    # NOTE: A little bit tricky to find dotfiles directory
    # Ref: https://unix.stackexchange.com/a/331710
    find .[!.]* * -maxdepth 0 -name "*" -type d,f \
        -not \( -path "setup.sh" -or -path "*.md" -or -path "!*" \) | while read dir; do

        src="$dotfiles_dir/$dir"

        dst="$HOME/$dir"

        symlink "$src" "$dst" "$2"
    done
}
