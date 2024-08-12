import { join } from 'path'
import { updateElectronApp } from 'update-electron-app'
import { checkSquirrel } from './CheckSquirrel'
import { ElectronHost } from './ElectronHost'


updateElectronApp()

if (checkSquirrel()) {
  ElectronHost.shutdown()
} else {
  ElectronHost.startup()
    .then(async _ => {
      await ElectronHost.openMainWindow({
        width: 980,
        height: 740,
        show: false,
        frontendURL: MAIN_WINDOW_VITE_DEV_SERVER_URL ?? join(
          __dirname,
          '..',
          `renderer/${ MAIN_WINDOW_VITE_NAME }/index.html`,
        ),
        icon: join(__dirname, 'icons/icon.ico'),
      })
    })
  
}
