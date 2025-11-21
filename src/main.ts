import { isPlatform } from '@peiyanlu/electron-ipc'
import { checkSquirrel, createTray, ElectronHost, IpcHost, onChildWindowOpenUrl } from '@peiyanlu/electron-ipc/backend'
import { app, BrowserWindow, globalShortcut, Menu } from 'electron'
import { join } from 'path'
import { updateElectronApp } from 'update-electron-app'
import { ElectronSvgHandler } from './electron/IpcHandler'


const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
const file = join(__dirname, '..', `renderer/${ MAIN_WINDOW_VITE_NAME }/index.html`)
const frontendURL = url ?? file

const resources = app.isPackaged ? process.resourcesPath : __dirname

const getIcon = (root: string) => {
  return join(root, 'icons', `icon.${ isPlatform('linux') ? 'png' : 'ico' }`)
}

const icon = getIcon(__dirname)
const trayIcon = join(resources)


if (checkSquirrel()) {
  ElectronHost.shutdown()
}

if (app.isPackaged) {
  updateElectronApp()
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
    icon,
    frontendURL,
    hideAppMenu: true,
    singleInstance: true,
    beforeReady: () => {
      app.commandLine.appendSwitch('log-level', '3')
      app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')
      
      onChildWindowOpenUrl()
    },
  })
  .then((window) => {
    if (!window) return
    
    window.flashFrame(true)
    window.once('focus', () => {
      setTimeout(() => window.flashFrame(false), 1000)
    })
    
    globalShortcut.register('CmdOrCtrl+Shift+I', () => {
      BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()
    })
    
    createTray({
      window: window,
      icon: trayIcon,
      menu: Menu.buildFromTemplate([
        {
          label: '打开',
          click: () => {
            window.show()
            window.focus()
          },
        },
        {
          label: '退出',
          click: () => {
            app.exit()
          },
        },
      ]),
      title: `${ APP_NAME } ${ APP_VERSION }`,
    })
    
  })

IpcHost.addListener('changeTheme', (_e, data: string) => {
  console.log('changeTheme:receiver', data)
})
