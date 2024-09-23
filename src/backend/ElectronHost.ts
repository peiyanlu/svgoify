import { app, BrowserWindow, BrowserWindowConstructorOptions, ipcMain } from 'electron'
import * as path from 'node:path'
import { IpcListener, IpcSocketBackend, RemoveFunction } from '../common/IpcSocket'
import { ElectronDialogHandler, ElectronSvgHandler } from './ElectronIpcHandler'
import { IpcHandler, IpcHost } from './IpcHost'


interface ElectronHostOptions {
  ipcHandlers?: (typeof IpcHandler)[];
}

interface BrowserWindowOptions extends BrowserWindowConstructorOptions {
  frontendURL: string
}


class ElectronIpc implements IpcSocketBackend {
  public send(channel: string, ...args: any[]): void {
    const win = ElectronHost.mainWindow ?? BrowserWindow.getAllWindows()[0]
    win?.webContents.send(channel, ...args)
  }
  
  public addListener(channel: string, listener: IpcListener): RemoveFunction {
    ElectronHost.ipcMain.addListener(channel, listener)
    return () => ElectronHost.ipcMain.removeListener(channel, listener)
  }
  
  public removeListener(channel: string, listener: IpcListener) {
    ElectronHost.ipcMain.removeListener(channel, listener)
  }
  
  public handle(channel: string, listener: (evt: any, ...args: any[]) => Promise<any>): RemoveFunction {
    ElectronHost.ipcMain.removeHandler(channel) // make sure there's not already a handler registered
    ElectronHost.ipcMain.handle(channel, listener)
    return () => ElectronHost.ipcMain.removeHandler(channel)
  }
}


export class ElectronHost {
  static readonly ipcMain = ipcMain
  private static _ipc: ElectronIpc
  static _mainWindow?: BrowserWindow
  
  private constructor() {}
  
  public static get mainWindow() { return this._mainWindow }
  
  public static get isValid() { return this._ipc !== undefined }
  
  static async startup(options?: ElectronHostOptions) {
    if (!this.isValid) {
      this._ipc = new ElectronIpc()
    }
    
    await IpcHost.startup({ socket: this._ipc })
    if (IpcHost.isValid) {
      ElectronDialogHandler.register()
      ElectronSvgHandler.register()
      options?.ipcHandlers?.forEach((ipc) => ipc.register())
    }
  }
  
  public static async openMainWindow(windowOptions: BrowserWindowOptions): Promise<void> {
    await app.whenReady()
    
    // 当所有窗口都关闭时退出应用程序（除非我们在 MacOS 上运行）
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
    
    // 如果主窗口已关闭并且应用程序已重新激活，请重新打开主窗口（这是 MacOS 的正常行为）
    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this._openWindow(windowOptions)
      }
    })
    
    await this._openWindow(windowOptions)
  }
  
  private static async _openWindow(options: BrowserWindowOptions) {
    const { webPreferences, frontendURL, ...others } = options
    
    const opts: BrowserWindowConstructorOptions = {
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'ElectronPreload.js'),
        experimentalFeatures: false,
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: true,
        nodeIntegrationInWorker: true,
        nodeIntegrationInSubFrames: false,
        ...webPreferences,
      },
      ...others,
    }
    
    const win = this._mainWindow = new BrowserWindow(opts)
    
    win.on('ready-to-show', () => win.show())
    
    win.webContents.session.on('will-download', (event, item, webContents) => {
      console.log(item)
      item.setSaveDialogOptions({
        title: '选择文件夹',
      })
    })
    
    const urlReg = /^(https?|file):\/\/.*/
    if (urlReg.test(frontendURL)) {
      await win.loadURL(frontendURL)
    } else {
      await win.loadFile(frontendURL)
    }
    
    win.show()
    
    if (!app.isPackaged) {
      win.webContents.toggleDevTools()
    }
  }
  
  public static shutdown(): void {
    app.exit()
  }
}
