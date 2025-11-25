import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { createPatchRequireJsonPlugin } from './vite.plugin.patch.mjs'


const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

declare global {
  const APP_NAME: string
  const APP_VERSION: string
}

export default defineConfig({
  publicDir: 'resources',
  define: {
    APP_NAME: JSON.stringify(pkg.productName),
    APP_VERSION: JSON.stringify(`v${ pkg.version }`),
  },
  build: {
    license: true,
    copyPublicDir: true,
  },
  plugins: [
    createPatchRequireJsonPlugin(),
  ],
})
