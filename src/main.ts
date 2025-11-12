import { isPlatform } from '@peiyanlu/electron-ipc'
import { checkSquirrel, ElectronHost, IpcHost } from '@peiyanlu/electron-ipc/backend'
import { join } from 'path'
import { ElectronSvgHandler } from './electron/IpcHandler'


const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
const file = join(__dirname, '..', `renderer/${ MAIN_WINDOW_VITE_NAME }/index.html`)
const frontendURL = url ?? file


if (checkSquirrel()) {
  ElectronHost.shutdown()
}

console.log(join(__dirname, `icons/icon.${ isPlatform('linux') ? 'png' : 'ico' }`))
ElectronHost
  .startup({
    ipcHandlers: [ ElectronSvgHandler ],
  })
  .then(async _ => {
    await ElectronHost.openMainWindow({
      webPreferences: {
        preload: require.resolve('./preload.js'),
        sandbox: false,
      },
      width: 980,
      height: 740,
      show: false,
      frontendURL,
      icon: join(__dirname, `icons/icon.${ isPlatform('linux') ? 'png' : 'ico' }`),
    })
  })

IpcHost.addListener('changeTheme', (_e, data: string) => {
  console.log('changeTheme:receiver', data)
})
