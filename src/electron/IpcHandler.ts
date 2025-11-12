import { IpcHandler } from '@peiyanlu/electron-ipc/backend'
import { svgoChannel, SvgoModuleMethod } from './IpcInterface'
import { SvgoIpcImpl } from './SvgoIpcImpl'


export class ElectronSvgHandler extends IpcHandler {
  public get channelName() { return svgoChannel }
  
  public async callMethod(method: SvgoModuleMethod, ...args: any[]) {
    const cmd = SvgoIpcImpl.instance
    if (!cmd) {
      throw new Error(`No active command`)
    }
    
    const func = (cmd as any)[method] as Function
    if (typeof func === 'function') {
      return func.call(cmd, ...args)
    } else {
      throw new Error(`illegal electron svg method`)
    }
  }
}
