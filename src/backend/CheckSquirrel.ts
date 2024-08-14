import { app } from 'electron'
import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import path from 'path'


const logPath = path.resolve(path.dirname(process.execPath), '..', '..', `${ path.basename(process.execPath) }.log`)

const run = function (args: string[], done: () => void) {
  const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe')
  fs.appendFileSync(logPath, updateExe + '\n')
  spawn(updateExe, args, { detached: true }).on('close', done)
}

export const checkSquirrel = () => {
  if (process.platform === 'win32') {
    const cmd = process.argv[1]
    
    const target = path.basename(process.execPath)
    
    if ([ '--squirrel-install', '--squirrel-updated' ].includes(cmd)) {
      fs.appendFileSync(logPath, cmd + '\n')
      run([ `--createShortcut=${ target }` ], app.quit)
      return true
    }
    
    if (cmd === '--squirrel-uninstall') {
      fs.appendFileSync(logPath, cmd + '\n')
      run([ `--removeShortcut=${ target }` ], app.quit)
      return true
    }
    
    if (cmd === '--squirrel-obsolete') {
      fs.appendFileSync(logPath, cmd + '\n')
      app.quit()
      return true
    }
    
    return false
  }
  return false
}

