import path, { resolve, normalize } from 'path'
import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { createSvgIconsPlugin } from './vite.plugin.icon'
import { pluginExposeRenderer } from './vite.base.config';
import vue from '@vitejs/plugin-vue'
import autoImport from 'unplugin-auto-import/vite'
import { VarletImportResolver } from '@varlet/import-resolver'
import components from 'unplugin-vue-components/vite'


// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<'renderer'>;
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';
  
  return {
    root,
    mode,
    base: './',
    build: {
      outDir: `.vite/renderer/${ name }`,
      chunkSizeWarningLimit: 1024 * 2,
      rollupOptions: {
        output: {
          // 最小化拆分包
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const name = id.toString().split('node_modules/').at(-1)
              if (name) {
                return name.split('/').at(0)
              } else {
                return id
              }
            }
          },
        },
      },
    },
    plugins: [
      vue(),
      pluginExposeRenderer(name),
      components({
        resolvers: [ VarletImportResolver() ]
      }),
      autoImport({
        resolvers: [ VarletImportResolver({ autoImport: true }) ]
      }),
      createSvgIconsPlugin({
        iconDirs: path.join(process.cwd(), 'svg-icons'),
        symbolId: 'symbol-[dir]-[name]',
        domId: 'svg-icons-dom'
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
      preserveSymlinks: true,
    },
    clearScreen: false,
  } as UserConfig;
});
