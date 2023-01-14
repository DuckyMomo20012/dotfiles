#!/usr/bin/env bash

_npm() {
    local cur
    cur=${COMP_WORDS[COMP_CWORD]}
    local cmd
    cmd=${COMP_WORDS[1]}
    local prev
    prev=${COMP_WORDS[COMP_CWORD - 1]}

    # Find all package.json files in the current directory and its subdirectories,
    # but not in the node_modules directory

    # Then merge all package.json files into one, then extract the dependencies and
    # devDependencies keys

    # Finally, remove duplicates and newlines
    packages=$(find * -type f -name "package.json" -not -path "*node_modules*" \
        -exec jq -n 'inputs | .dependencies + .devDependencies | try keys[] catch ""' {} '+' \
        | awk '!seen[$0]++' \
        | tr '\n' ' ')

    # We can safely ignore warning SC2207 since it warns that it will uses the
    # shell's sloppy word splitting and globbing. The possible commands here are
    # all single words, and most likely won't contain special chars the shell will
    # expand.
    COMPREPLY=()

    case "$cmd" in
        install | add | remove)
            COMPREPLY=( $(compgen -W "$packages" -- "$cur") )
            ;;

    esac

    return 0
}

complete -F _npm pnpm
complete -F _npm yarn
complete -F _npm npm
