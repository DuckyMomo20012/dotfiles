# misc

Small system fixes that do not belong anywhere else. Both are safe to repeat.

## What runs

`setup.ts`:

1. **Hardware clock in local time.** `timedatectl set-local-rtc 1`, so a dual boot
   with Windows does not shift the time. Skipped when
   `timedatectl show -p LocalRTC --value` already says `yes`.
2. **Audio click/popping fix.** Ensures the line
   `options snd_hda_intel power_save=0` is in `/etc/modprobe.d/alsa-base.conf`.
   The line is added once: the file is read first and only written (with `sudo`)
   when the line is missing.

## Run it

```bash
bun misc/setup.ts --dry-run
bun bootstrap.ts --only misc
```

Second run: no sudo prompt and no change.

```text
Fixing time conflict...
RTC is already in local time.
Fix audio click/popping sound...
```

Reboot (or `sudo modprobe -r snd_hda_intel && sudo modprobe snd_hda_intel`) for the
audio option to apply.

## Notes

- These are workarounds for specific hardware/setups. Delete a block you do not
  need, or skip the file: `bun bootstrap.ts --skip misc`.
- `timedatectl` needs systemd. In a container the first step fails; skip the
  directory there.
