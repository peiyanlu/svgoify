import { dialogChannel, svgoChannel, SvgoIpcInterface } from '../common/ElectronIpcInterface'
import { IpcListener, IpcSocketFrontend } from '../common/IpcSocket'
import { ElectronApi } from '../common/ElectronApi'
import { IpcApp } from './IpcApp'
import { ProcessDetector } from './ProcessDetector'


declare global {
  interface Window {
    ipcRenderer: ElectronApi;
  }
}


class ElectronIpc implements IpcSocketFrontend {
  private readonly _api: ElectronApi
  
  constructor() {
    this._api = window.ipcRenderer
  }
  
  public send(channel: string, ...data: any[]) {
    this._api.send(channel, ...data)
  }
  
  public addListener(channelName: string, listener: IpcListener) {
    this._api.addListener(channelName, listener)
    return () => this._api.removeListener(channelName, listener)
  }
  
  public removeListener(channelName: string, listener: IpcListener) {
    this._api.removeListener(channelName, listener)
  }
  
  public async invoke(channel: string, ...args: any[]) {
    return this._api.invoke(channel, ...args)
  }
}


export class ElectronApp {
  public static dialogIpc = IpcApp.makeIpcFunctionProxy<Electron.Dialog>(dialogChannel, 'callDialog')
  public static svgoIpc = IpcApp.makeIpcFunctionProxy<SvgoIpcInterface>(svgoChannel, 'callMethod')
  
  
  private static _ipc?: ElectronIpc
  
  public static get isValid(): boolean { return undefined !== this._ipc }
  
  public static async startup() {
    if (!ProcessDetector.isElectronAppFrontend) {
      throw new Error('Not running under Electron')
    }
    if (!this.isValid) {
      this._ipc = new ElectronIpc()
    }
    await IpcApp.startup(this._ipc!)
  }
  
  public static async shutdown() {
    this._ipc = undefined
    await IpcApp.shutdown()
  }
}
