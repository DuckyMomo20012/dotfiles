import { $ } from 'bun'
import { logger, prettyAptInstall } from '../scripts/utils'

logger.info('Installing ibus-bamboo...')

await prettyAptInstall(`sudo add-apt-repository ppa:bamboo-engine/ibus-bamboo -y`)

await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install ibus ibus-bamboo --install-recommends -y`)

await $`ibus restart`

await $`env DCONF_PROFILE=ibus dconf write /desktop/ibus/general/preload-engines "['BambooUs', 'Bamboo']" && gsettings set org.gnome.desktop.input-sources sources "[('xkb', 'us'), ('ibus', 'Bamboo')]"`
