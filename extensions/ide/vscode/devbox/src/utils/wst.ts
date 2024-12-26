import * as os from 'os'
import * as path from 'path'
import * as vscode from 'vscode'

import { execa } from 'execa'
import { Logger } from '../common/logger'

export class Wst {
  static async init(context: vscode.ExtensionContext) {
    Logger.info('Checking wst...')

    try {
      // check chisel version
      await execa('wst', ['--version'])
    } catch {
      // chisel not installed, install it
      const platform = os.platform()

      try {
        const extensionPath = context.extensionPath
        let wstPath = ''
        let currentPath = ''

        switch (platform) {
          case 'win32':
            wstPath = path.join(
              extensionPath,
              'resources',
              'wst-release',
              'wst.exe'
            )

            currentPath = process.env.PATH || ''
            if (!currentPath.includes(wstPath)) {
              await execa('powershell.exe', [
                '-Command',
                `[Environment]::SetEnvironmentVariable("Path", "$env:Path;${wstPath}", "User")`,
              ])
            }
            break
          case 'darwin':
          case 'linux':
          case 'openbsd':
            wstPath = path.join(
              extensionPath,
              'resources',
              'wst-release',
              'wst'
            )
            currentPath = process.env.PATH || ''
            if (!currentPath.includes(wstPath)) {
              const homeDir = os.homedir()
              const shellConfigFiles = []

              const currentShell = process.env.SHELL || ''

              if (currentShell.includes('zsh')) {
                shellConfigFiles.push(path.join(homeDir, '.zshrc'))
              } else if (currentShell.includes('bash')) {
                shellConfigFiles.push(path.join(homeDir, '.bashrc'))
              }

              shellConfigFiles.push(
                path.join(homeDir, '.profile'),
                path.join(homeDir, '.bash_profile')
              )

              const pathEntry = `\nexport PATH="$PATH:${wstPath}"\n`
              for (const configFile of shellConfigFiles) {
                try {
                  const { access } = require('fs/promises')
                  await access(configFile)
                  await execa('sh', [
                    '-c',
                    `echo '${pathEntry}' >> "${configFile}"`,
                  ])
                  await execa('sh', ['-c', `source ${configFile}`])
                  Logger.info(`Updated PATH in ${configFile}`)
                  break
                } catch (error) {
                  Logger.debug(`Skipping ${configFile}: ${error}`)
                  continue
                }
              }

              // 立即更新当前进程的 PATH
              process.env.PATH = `${process.env.PATH}:${wstPath}`
            }

            break
          default:
            Logger.error(`Unsupported operating system: ${platform}`)
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Wst installed failed: ${error}`)
        Logger.error(`Wst installed failed: ${error}`)
      }
    }
  }
}
