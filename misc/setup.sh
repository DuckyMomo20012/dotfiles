#!/usr/bin/env bash

# Fix time conflict
echo "Fixing time conflict..."
sudo timedatectl set-local-rtc 1

# Fix audio click/popping sound
echo "Fix audio click/popping sound..."
echo "options snd_hda_intel power_save=0" | sudo tee -a /etc/modprobe.d/audio_disable_powersave.conf
