# misc

Small system fixes:

- Store the hardware clock in local time, so dual boot with Windows does not
  shift the time. Skipped when it is already set.
- Disable audio power saving to stop click/popping sounds
  (`/etc/modprobe.d/alsa-base.conf`). The line is added once.
