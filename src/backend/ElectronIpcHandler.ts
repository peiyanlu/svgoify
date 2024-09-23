import { dialog } from 'electron'
import { dialogChannel, DialogModuleMethod, svgoChannel, SvgoModuleMethod } from '../common/ElectronIpcInterface'
import { IpcHandler } from './IpcHost'
import { SvgoIpcImpl } from './SvgoIpcImpl'


export class ElectronDialogHandler extends IpcHandler {
  public get channelName() { return dialogChannel }
  
  public async callDialog(method: DialogModuleMethod, ...args: any) {
    const dialogMethod = dialog[method] as Function
    if (typeof dialogMethod !== 'function') {
      throw new Error(`illegal electron dialog method`)
    }
    
    return dialogMethod.call(dialog, ...args)
  }
}


export class ElectronSvgHandler extends IpcHandler {
  public get channelName() { return svgoChannel }
  
  public async callMethod(method: SvgoModuleMethod, ...args: any[]) {
    const cmd = SvgoIpcImpl.instance
    if (!cmd) {
      throw new Error(`No active command`)
    }
    
    const func = (cmd as any)[method] as Function
    if (typeof func === 'function') {
      return func.call(this, ...args)
    } else {
      throw new Error(`illegal electron svg method`)
    }
  }
}
