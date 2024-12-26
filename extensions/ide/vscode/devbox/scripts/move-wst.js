const fs = require('fs')
const path = require('path')

const platformFileNameMap = {
  'win32-x64': 'windows-amd64.exe',
  'win32-arm64': 'windows-arm64.exe',
  'linux-x64': 'linux-amd64',
  'linux-arm64': 'linux-arm64',
  'darwin-x64': 'darwin-amd64',
  'darwin-arm64': 'darwin-arm64',
}

const platformFileName = platformFileNameMap[process.env.PLATFORM]

const sourceDir = path.join(__dirname, '../resources/wst')
const targetDir = path.join(__dirname, '../resources/wst-release')

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

const isWindows = process.env.PLATFORM.startsWith('win32')

const sourceFile = path.join(sourceDir, platformFileName)
const targetFile = path.join(targetDir, isWindows ? 'wst.exe' : 'wst')

try {
  fs.copyFileSync(sourceFile, targetFile)
  console.log(`move success: ${sourceFile} -> ${targetFile}`)
} catch (error) {
  console.error(`move failed: ${error.message}`)
  process.exit(1)
}
