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
              await execa('sh', ['-c', `export PATH="$PATH:${wstPath}"`])
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
