import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { join } from 'path'


const RENDERER_DIR_NAME: string = 'main_window'

const iconDir: string = `.vite/renderer/${ RENDERER_DIR_NAME }/icons`

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    overwrite: true,
    // 任务栏 & 快捷方式 不带后缀
    icon: join(__dirname, iconDir, 'icon'),
    ignore: [
      /(\.idea|\.vscode|\.npmrc|\.gitignore|public|src|svg-icons)/,
      /\w*\.(ts|json)$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      //用于控制面板->应用程序中显示
      iconUrl: join(__dirname, iconDir, 'icon.ico'),
      //安装文件显示
      setupIcon: join(__dirname, iconDir, 'icon.ico'),
      //安装时的动画，就是这个
      loadingGif: join(__dirname, iconDir, 'loading.gif'),
    }),
    new MakerZIP({}, [ 'darwin', 'win32' ]),
    new MakerRpm({}),
    new MakerDeb({})
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/backend/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/backend/ElectronPreload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: RENDERER_DIR_NAME,
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
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
      config: {
        repository: {
          owner: 'peiyanlu',
          name: 'svgoify',
        },
        prerelease: true,
        draft: false,
        force: true
      },
    },
  ],
};

export default config;
