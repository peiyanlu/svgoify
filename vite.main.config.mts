import { defineConfig, UserConfig } from 'vite'
import { createPatchRequireJsonPlugin } from './vite.plugin.patch.mjs'


export default defineConfig(({ mode }) => {
  return {
    build: {
      license: true,
      copyPublicDir: mode === 'development',
    },
    plugins: [
      createPatchRequireJsonPlugin(),
    ],
  } satisfies UserConfig
})
