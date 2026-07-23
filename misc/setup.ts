import { $ } from 'bun'
import { logger } from '../lib/utils'

logger.info('Fixing time conflict...')
await $`sudo timedatectl set-local-rtc 1`

logger.info('Fix audio click/popping sound...')
await $`echo 'options snd_hda_intel power_save=0' | sudo tee -a /etc/modprobe.d/alsa-base.conf`
