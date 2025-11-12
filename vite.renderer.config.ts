import { VarletImportResolver } from '@varlet/import-resolver'
import vue from '@vitejs/plugin-vue'
import { join, resolve } from 'path'
import autoImport from 'unplugin-auto-import/vite'
import components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { createSvgIconsPlugin } from './vite.plugin.icon'


// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    components({
      resolvers: [ VarletImportResolver() ],
    }),
    autoImport({
      resolvers: [ VarletImportResolver({ autoImport: true }) ],
    }),
    createSvgIconsPlugin({
      iconDirs: [ join(process.cwd(), 'svg-icons') ],
      symbolId: 'symbol-[dir]-[name]',
      domId: 'svg-icons-dom',
    }),
  ],
})
