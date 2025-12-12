import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { PublisherGithub } from '@electron-forge/publisher-github';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'Transcriptor',
    executableName: 'Transcriptor',
    appBundleId: 'com.transcriptor.app',
    // icon: './assets/icons/icon', // Uncomment when you have icon files (icon.icns for macOS, icon.ico for Windows)
  },
  rebuildConfig: {},
  makers: [
    // macOS DMG installer
    new MakerDMG({
      name: 'Transcriptor',
      background: './assets/dmg-background.png', // Optional: custom DMG background
      format: 'ULFO',
    }, ['darwin']),
    // macOS ZIP (alternative to DMG)
    new MakerZIP({}, ['darwin']),
    // Windows Squirrel installer
    new MakerSquirrel({
      name: 'Transcriptor',
      // iconUrl: 'https://example.com/icon.ico', // Optional: URL to icon for shortcuts
      setupIcon: './assets/icons/icon.ico', // Icon for installer (when you have it)
    }),
    // Linux packages
    new MakerDeb({
      options: {
        name: 'transcriptor',
        productName: 'Transcriptor',
        genericName: 'Audio Transcription App',
        categories: ['Utility', 'AudioVideo'],
      }
    }),
    new MakerRpm({
      options: {
        name: 'transcriptor',
        productName: 'Transcriptor',
        genericName: 'Audio Transcription App',
        categories: ['Utility', 'AudioVideo'],
      }
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'DonMrMango',
        name: 'transcriptor-electron'
      },
      prerelease: false,
      draft: true, // Creates draft release (you can publish manually)
    })
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      // Configure ports to avoid EADDRINUSE conflicts
      // Note: These are fixed ports, but less commonly used than 3000/9000
      port: 3333,        // Renderer dev server port (default is 3000)
      loggerPort: 9333,  // Logger port (default is 9000)
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
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
};

export default config;
