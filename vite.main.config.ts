import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, UserConfig } from 'vite'


export default defineConfig(({ mode }) => {
  return {
    build: {
      license: true,
      copyPublicDir: mode === 'development',
      rollupOptions: {
        plugins: [
          {
            name: 'csso/css-tree-json-patch',
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
                  const file = resolve(__dirname, item.path)
                  const json = readFileSync(file, 'utf-8')
                  const str = JSON.stringify(JSON.parse(json))
                  
                  return { code: code.replace(item.target, str) }
                }
              }
            },
          },
        ],
      },
    },
  } satisfies UserConfig
})
