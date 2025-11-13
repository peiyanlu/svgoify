import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerDMG } from '@electron-forge/maker-dmg'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig } from '@electron-forge/shared-types'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import { isPlatform } from '@peiyanlu/electron-ipc'
import { join } from 'path'
import pkg from './package.json'


const APP_NAME = pkg.productName ?? 'SVGoify'
const RENDERER_DIR_NAME: string = 'main_window'
const iconDir: string = `.vite/renderer/${ RENDERER_DIR_NAME }/icons`


const config: ForgeConfig = {
  packagerConfig: {
    name: APP_NAME,
    // Linux 只能小写
    executableName: isPlatform('linux') ? APP_NAME.toLowerCase() : undefined,
    asar: true,
    overwrite: true,
    // 任务栏 & 快捷方式 不带后缀
    icon: join(__dirname, iconDir, 'icon'),
    win32metadata: {
      // 应用安装之后显示的名称
      ProductName: APP_NAME,
      FileDescription: pkg.description,
    },
    ignore: (file: string) => {
      if (!file) return false
      return ![ '/.vite', '/node_modules' ].some(prefix => file.startsWith(prefix))
    },
  },
  rebuildConfig: {},
  makers: [
    // Windows
    new MakerSquirrel({
      // 用于控制面板->应用程序中显示
      iconUrl: 'https://krseoul.imgtbl.com/i/2024/08/16/66bee9aacb3b9.ico',
    }),
    // new MakerMSIX({}),
    // 全平台都可用
    new MakerZIP({}),
    // Mac 标准格式
    new MakerDMG({}),
    // Linux redhat，centos，Fedora
    new MakerRpm({}),
    // Linux debian，ubuntu
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: RENDERER_DIR_NAME,
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      platforms: [ 'all' ],
      config: {
        repository: {
          owner: 'peiyanlu',
          name: 'svgoify',
        },
        draft: true,
        prerelease: false,
        generateReleaseNotes: true,
      },
    },
  ],
}

export default config
