#!/usr/bin/env bash

# NOTE: Setup for AppImage

# Ref: https://github.com/AppImage/AppImageKit/wiki/FUSE
sudo add-apt-repository universe -y
sudo apt install libfuse2
