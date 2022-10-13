#!/usr/bin/env bash

# Fix time conflict
echo "Fixing time conflict..."
sudo timedatectl set-local-rtc 1
