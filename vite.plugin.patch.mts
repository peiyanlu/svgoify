import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Plugin } from 'vite'


export function createPatchRequireJsonPlugin(): Plugin {
  return {
    name: 'PatchRequireJsonPlugin',
    transform(code, id) {
      const tasks = [
        {
          id: 'node_modules/css-tree/lib/data-patch.js',
          target: `require('../data/patch.json')`,
          path: 'node_modules/css-tree/data/patch.json',
        },
        {
          id: 'node_modules/csso/node_modules/css-tree/lib/version.js',
          target: `require('../package.json')`,
          path: 'node_modules/csso/node_modules/css-tree/package.json',
        },
        {
          id: 'node_modules/css-tree/lib/version.js',
          target: `require('../package.json')`,
          path: 'node_modules/css-tree/package.json',
        },
        {
          id: 'node_modules/csso/lib/version.js',
          target: `require('../package.json')`,
          path: 'node_modules/csso/package.json',
        },
      ]
      for (const item of tasks) {
        if (id.includes(item.id)) {
          const x = (path: string) => {
            const file = resolve(__dirname, path)
            const json = readFileSync(file, 'utf-8')
            return JSON.stringify(JSON.parse(json))
          }
          
          return { code: code.replace(item.target, x(item.path)) }
        }
      }
    },
  }
}
