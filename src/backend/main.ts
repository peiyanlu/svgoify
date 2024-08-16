import { PlatformDetector } from './PlatformDetector'
import { join } from 'path'
import { checkSquirrel } from './CheckSquirrel'
import { ElectronHost } from './ElectronHost'

const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
const file = join(__dirname, '..', `renderer/${ MAIN_WINDOW_VITE_NAME }/index.html`)

if (checkSquirrel()) {
  ElectronHost.shutdown()
} else {
  ElectronHost.startup()
    .then(async _ => {
      await ElectronHost.openMainWindow({
        width: 980,
        height: 740,
        show: false,
        frontendURL: url ?? file,
        icon: join(__dirname, `icons/icon.${ PlatformDetector.isLinux ? 'png' : 'ico' }`),
      })
    })
}

