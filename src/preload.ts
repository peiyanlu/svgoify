import { contextBridge } from 'electron'
import { frontendApiKey, getFrontendApi } from '@peiyanlu/electron-ipc'


contextBridge.exposeInMainWorld(frontendApiKey, getFrontendApi())

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  
  for (const dependency of [ 'chrome', 'node', 'electron' ]) {
    replaceText(`${ dependency }-version`, process.versions[dependency])
  }
})
