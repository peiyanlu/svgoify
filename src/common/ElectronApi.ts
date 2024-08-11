import type { IpcRendererEvent } from 'electron'


/** These methods are stored on `window.ipcRenderer` */
export interface ElectronApi {
  addListener: (channel: string, listener: ElectronListener) => void;
  removeListener: (channel: string, listener: ElectronListener) => void;
  invoke: (channel: string, ...data: any[]) => Promise<any>;
  once: (channel: string, listener: ElectronListener) => void;
  send: (channel: string, ...data: any[]) => void; // only valid for render -> main
}

export type ElectronListener = (evt: IpcRendererEvent, ...args: any[]) => void;
