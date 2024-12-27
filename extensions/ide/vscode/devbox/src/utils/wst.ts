import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import { execa } from 'execa'
import * as vscode from 'vscode'

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
        const targetDir = path.join(os.homedir(), '.ssh', 'sealos', 'bin')

        switch (platform) {
          case 'win32':
            wstPath = path.join(
              extensionPath,
              'resources',
              'wst-release',
              'wst.exe'
            )
            await fs.promises.mkdir(targetDir, { recursive: true })
            await fs.promises.copyFile(wstPath, path.join(targetDir, 'wst.exe'))
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
            await fs.promises.mkdir(targetDir, { recursive: true })
            await fs.promises.copyFile(wstPath, path.join(targetDir, 'wst'))
            await execa('chmod', ['+x', path.join(targetDir, 'wst')])

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
