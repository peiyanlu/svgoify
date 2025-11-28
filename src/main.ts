import {
  checkSquirrel,
  createTray,
  ElectronHost,
  getIconExt,
  inspectElement,
  IpcHost,
  isDev,
  onChildWindowOpenUrl,
  showAndFocus,
  writeLog,
} from '@peiyanlu/electron-ipc/backend'
import { app, autoUpdater, BrowserWindow, dialog, globalShortcut, Menu } from 'electron'
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
  .then(async (window) => {
    if (!window) return
    window.setBackgroundColor('#141218')
    
    if (isDev) {
      globalShortcut.register('CmdOrCtrl+Shift+I', () => {
        BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()
      })
    }
    
    const tray = createTray({
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
    
    IpcHost.addListener('element:focus', async (_evt, data) => {
      await inspectElement(window, data, [ 1, 1 ])
    })
    
    
    if (!isDev) {
      updateElectronApp({
        onNotifyUser: async ({ event, ...info }) => {
          writeLog(`UPDATE: ${ Object.values(info).join(' ') }`)
          
          const { response } = await dialog.showMessageBox({
            icon: trayIcon,
            title: APP_NAME,
            message: `${ APP_VERSION } 版本已下载，重启应用后生效`,
            detail: '取消后，更新仍会在下一次应用启动时生效',
          })
          if (0 === response) {
            tray.enableQuit()
            autoUpdater.quitAndInstall()
          }
        },
      })
    }
  })
