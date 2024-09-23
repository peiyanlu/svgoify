import { contextBridge, ipcRenderer } from 'electron'
import { ElectronListener, ElectronApi } from '../common/ElectronApi'


function checkPrefix(channel: string) {
  if (!channel.startsWith('ipc.')) {
    throw new Error(`illegal channel name '${ channel }'`)
  }
}


const frontendApi: ElectronApi = {
  send(channel: string, ...data: any[]) {
    checkPrefix(channel)
    ipcRenderer.send(channel, ...data)
  },
  addListener(channel: string, listener: ElectronListener) {
    checkPrefix(channel)
    return ipcRenderer.addListener(channel, listener)
  },
  removeListener(channel: string, listener: ElectronListener) {
    return ipcRenderer.removeListener(channel, listener)
  },
  once(channel: string, listener: ElectronListener) {
    checkPrefix(channel)
    return ipcRenderer.once(channel, listener)
  },
  async invoke(channel: string, ...data: any[]): Promise<any> {
    checkPrefix(channel)
    return ipcRenderer.invoke(channel, ...data)
  },
}


contextBridge.exposeInMainWorld('ipcRenderer', frontendApi)


window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  
  for (const dependency of [ 'chrome', 'node', 'electron' ]) {
    replaceText(`${ dependency }-version`, process.versions[dependency])
  }
})
