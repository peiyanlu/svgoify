import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'


import pkg from './package.json'


const builtins = [ 'electron', ...builtinModules.map((m) => [ m, `node:${ m }` ]).flat() ]
const deps = Object.keys('dependencies' in pkg ? (pkg.dependencies as Record<string, string>) : {})
const external = [ ...builtins, ...deps ]

export default defineConfig({
  build: {
    copyPublicDir: true,
    rollupOptions: {
      external,
    },
  },
})
