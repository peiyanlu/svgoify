import {
  checkSquirrel,
  checkUpdate,
  ElectronHost,
  getIconExt,
  inspectElement,
  IpcHost,
  isDev,
  onChildWindowOpenUrl,
  showAndFocus,
} from '@peiyanlu/electron-ipc/backend'
import { app, BrowserWindow, dialog, globalShortcut, Menu } from 'electron'
import { join } from 'path'
import { ElectronSvgHandler } from './electron/IpcHandler'


const file = join(__dirname, '..', `renderer/${ MAIN_WINDOW_VITE_NAME }/index.html`)
const frontendURL = MAIN_WINDOW_VITE_DEV_SERVER_URL ?? file


const getIcon = (root: string, tray?: boolean) => join(root, 'icons', `icon.${ getIconExt(tray) }`)

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
    backgroundColor: '#141218',
    beforeReady: () => {
      app.commandLine.appendSwitch('log-level', '3')
      app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')
      
      onChildWindowOpenUrl()
    },
    tray: {
      icon: trayIcon,
      menu: Menu.buildFromTemplate([
        {
          label: '打开',
          click: () => {
            showAndFocus(ElectronHost.mainWindow)
          },
        },
        {
          label: '退出',
          click: () => {
            ElectronHost.shutdown()
          },
        },
      ]),
      title: `${ APP_NAME } ${ APP_VERSION }`,
    },
  })
  .then(async (window) => {
    if (!window) return
    
    if (isDev) {
      globalShortcut.register('CmdOrCtrl+Shift+I', () => {
        BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()
      })
    }
    
    IpcHost.addListener('element:focus', async (_evt, data) => {
      await inspectElement(window, data, [ 1, 1 ])
    })
  })


if (!isDev) {
  checkUpdate({
    repo: 'peiyanlu/svgoify',
    onNotifyUser: async ({ done }) => {
      const { response } = await dialog.showMessageBox({
        icon: trayIcon,
        title: APP_NAME,
        message: '新版本已准备好，确定重启并安装？',
        detail: '关闭后，更新将在下次启动时应用',
      })
      if (0 === response) {
        done()
      }
    },
  })
}
