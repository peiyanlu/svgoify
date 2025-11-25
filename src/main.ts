import {
  checkSquirrel,
  createTray,
  ElectronHost,
  getIconExt,
  isDev,
  onChildWindowOpenUrl,
  showAndFocus,
} from '@peiyanlu/electron-ipc/backend'
import { app, BrowserWindow, globalShortcut, Menu } from 'electron'
import { join } from 'path'
import { updateElectronApp } from 'update-electron-app'
import { ElectronSvgHandler } from './electron/IpcHandler'


const file = join(__dirname, '..', `renderer/${ MAIN_WINDOW_VITE_NAME }/index.html`)
const frontendURL = MAIN_WINDOW_VITE_DEV_SERVER_URL ?? file


const getIcon = (root: string, tray?: boolean) => {
  return join(root, 'icons', `icon.${ getIconExt(tray) }`)
}
const appIcon = getIcon(__dirname)
const trayIcon = getIcon(isDev ? __dirname : process.resourcesPath, true)


if (checkSquirrel()) {
  ElectronHost.shutdown()
}

ElectronHost.startup({
  ipcHandlers: [ ElectronSvgHandler ],
})

ElectronHost.openMainWindow({
    webPreferences: {
      preload: require.resolve('./preload.js'),
      sandbox: true,
    },
    width: 1200,
    height: 750,
    icon: appIcon,
    frontendURL,
    hideAppMenu: true,
    singleInstance: true,
    devTools: true,
    beforeReady: () => {
      app.commandLine.appendSwitch('log-level', '3')
      app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')
      
      onChildWindowOpenUrl()
    },
  })
  .then((window) => {
    if (!window) return
    
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
            showAndFocus(window)
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


if (!isDev) {
  updateElectronApp()
}
