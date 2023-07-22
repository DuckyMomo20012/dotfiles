#!/usr/bin/env bash

############################################
# Prepare environment

crontab_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$crontab_dir"

############################################
# Script body


############################################
# NOTE: I didn't extract this to new file because I want this file doesn't have
# many dependencies
crawlAndCheck() {
    name="$1"

    url="$2"

    prefix="$3"

    suffix="$4"

    oldValue="$5"

    websiteListFile="$6"

    action="${7:-"O"}"

    echo "Crawling new version for $name..."
    # Ref: https://stackoverflow.com/a/42263514/12512981
    result=$(curl -sSL  -H 'Cache-Control: no-cache' "$url?$(date +%s)")


    # NOTE: minor and patch version can be optional
    pattern="$prefix([[:digit:]]+(\.[[:digit:]]+){0,1}(\.[[:digit:]]+){0,1})$suffix"

    if [[ "$result" =~ $pattern ]]; then

        # We will reuse this variable for updating the version
        NEW_VALUE="${BASH_REMATCH[1]}"

        if [[ $NEW_VALUE != $oldValue ]]; then
            echo "New version of $name: $NEW_VALUE"

            case "$action" in
                O)
                    # Update version
                    echo "Updating version..."

                    backupExt=""
                    ;;

                B)
                    echo "Backuping old file & Updating version..."

                    # Backup file with filename.bak
                    backupExt=".bak"
                    ;;


                *)
                    echo "Invalid action: $action"
                    return 1
                    ;;
            esac

            # NOTE: I added many information before oldValue to make
            # sure sed won't replace the wrong line

            # NOTE: I use sed delimiter as comma (,) because I don't
            # want to conflict my string with sed default delimiter (/)
            # Ref: https://stackoverflow.com/a/16778711/12512981

            sed -i"$backupExt" -E "s,($name.*$url.*$prefix.*$suffix.*)($oldValue),\1$NEW_VALUE,g" "$websiteListFile"
        else
            echo "$name is up to date"
        fi
    else
        echo "Failed to check version of $name"
    fi
}
############################################

COMMENT=\#*

# Default values
default_websiteListFile="$(cd "$crontab_dir" && pwd)/website.txt"
default_action="O"

websiteListFile="$default_websiteListFile"
action="$default_action"

printUsage() {
    echo "Check version of website"
    echo ""
    echo "Usage: $(basename $0) [options]"
    echo "Options:"
    echo "  -f <file>    Source file contains list of website to check"
    echo "  -b           Backup old file before updating"
    echo "  -h           Show help message"
}

while getopts ':f:bh' opt; do
  case "$opt" in
    f)
        websiteListFile="${OPTARG}"
        ;;

    b)
        # Backup file with filename.bak
        action="B"
        ;;

    h)
        printUsage
        exit 0
        ;;

    :)
        echo -e "$0: option requires an argument.\n"
        printUsage
        exit 1
        ;;

    ?)
        echo -e "$0: illegal option.\n"
        printUsage
        exit 1
        ;;
  esac
done

while IFS= read -r website; do

    if [[ $website == $COMMENT || $website == "" ]]; then continue; fi

    IFS="," read -r name url prefix suffix oldValue <<< "$website"

    crawlAndCheck "$name" "$url" "$prefix" "$suffix" "$oldValue" "$websiteListFile" "$action"

done < "$websiteListFile"
