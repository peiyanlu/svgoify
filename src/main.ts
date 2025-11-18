import { isPlatform } from '@peiyanlu/electron-ipc'
import { checkSquirrel, ElectronHost, IpcHost, onChildWindowOpenUrl } from '@peiyanlu/electron-ipc/backend'
import { app, BrowserWindow, globalShortcut } from 'electron'
import { join } from 'path'
import { ElectronSvgHandler } from './electron/IpcHandler'


const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
const file = join(__dirname, '..', `renderer/${ MAIN_WINDOW_VITE_NAME }/index.html`)
const frontendURL = url ?? file


if (checkSquirrel()) {
  ElectronHost.shutdown()
}


ElectronHost.startup({
  ipcHandlers: [ ElectronSvgHandler ],
})

ElectronHost.openMainWindow({
    webPreferences: {
      preload: require.resolve('./preload.js'),
      sandbox: false,
    },
    width: 1200,
    height: 750,
    icon: join(__dirname, `icons/icon.${ isPlatform('linux') ? 'png' : 'ico' }`),
    frontendURL,
    hideAppMenu: true,
    singleInstance: true,
    beforeReady: () => {
      app.commandLine.appendSwitch('log-level', '3')
      app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')
      
      onChildWindowOpenUrl()
    },
  })
  .then(_ => {
    
    globalShortcut.register('CmdOrCtrl+Shift+I', () => {
      BrowserWindow.getFocusedWindow()?.webContents.openDevTools()
    })
  })

IpcHost.addListener('changeTheme', (_e, data: string) => {
  console.log('changeTheme:receiver', data)
})
