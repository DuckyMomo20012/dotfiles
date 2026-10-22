import { appendRootLine, capture, exec, logger } from '../lib/utils'

logger.info('Fixing time conflict...')
if (await capture(['timedatectl', 'show', '-p', 'LocalRTC', '--value']) === 'yes')
  logger.info('RTC is already in local time.')
else
  await exec(['sudo', 'timedatectl', 'set-local-rtc', '1'])

logger.info('Fix audio click/popping sound...')
// NOTE: `appendRootLine` only adds the line when it is missing, so re-running
// does not stack duplicate options.
await appendRootLine('/etc/modprobe.d/alsa-base.conf', 'options snd_hda_intel power_save=0')
