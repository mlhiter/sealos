import * as vscode from 'vscode'
import * as os from 'os'

import { execa } from 'execa'
import { Logger } from '../common/logger'

export class Chisel {
  static async init(context: vscode.ExtensionContext) {
    Logger.info('Checking chisel...')
    try {
      // check chisel version
      await execa('chisel', ['--version'])
    } catch {
      // chisel not installed, install it
      const platform = os.platform()

      try {
        await execa('curl', ['--version'])
      } catch {
        vscode.window.showErrorMessage(
          'curl is not installed. Please install curl and try again.'
        )
        return
      }

      try {
        switch (platform) {
          case 'win32':
            break
          case 'darwin':
          case 'linux':
          case 'openbsd':
            const terminal = vscode.window.createTerminal('Chisel Installation')
            terminal.show()
            terminal.sendText('curl https://i.jpillora.com/chisel! | sudo bash')

            vscode.window.showInformationMessage(
              'Please enter your password to complete the installation of Chisel.'
            )
            break
          default:
            Logger.error(`Unsupported operating system: ${platform}`)
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Chisel installed failed: ${error}`)
      }
    }
  }
}
