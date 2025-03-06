import * as os from "os";
import path from "path";
import * as fs from "fs";
import { execa } from "execa";
import { Logger } from "../common/logger";

// File access permission modification
export const ensureFileAccessPermission = async (path: string) => {
  Logger.info(`Ensuring file access permission for ${path}`);
  if (os.platform() === "win32") {
    try {
      // 使用 PowerShell 设置文件权限
      // 1. 禁用继承
      // 2. 移除所有现有权限
      // 3. 只给当前用户完全控制权限
      const powershellScript = `
        $acl = Get-Acl -Path "${path.replace(/\\/g, "\\\\")}";
        $acl.SetAccessRuleProtection($true, $false);
        $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name;
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($currentUser, "FullControl", "Allow");
        $acl.AddAccessRule($accessRule);
        Set-Acl -Path "${path.replace(/\\/g, "\\\\")}" -AclObject $acl;
      `;
      await execa("powershell", ["-Command", powershellScript]);
    } catch (error) {
      Logger.error(`Failed to set file access permission: ${error}`);
    }
  } else {
    await execa("chmod", ["600", path]);
  }

  Logger.info(`File access permission set for ${path}`);
};

export function ensureFileExists(filePath: string, parentDir: string) {
  if (filePath.indexOf("\0") !== -1 || parentDir.indexOf("\0") !== -1) {
    throw new Error("Invalid path");
  }
  const safeFilePath = path
    .normalize(filePath)
    .replace(/^(\.\.(\/|\\|$))+/, "");
  const safeParentDir = path
    .normalize(parentDir)
    .replace(/^(\.\.(\/|\\|$))+/, "");

  if (!fs.existsSync(safeFilePath)) {
    fs.mkdirSync(path.resolve(os.homedir(), safeParentDir), {
      recursive: true,
    });
    fs.writeFileSync(filePath, "", "utf8");
  }
  // .ssh/config authority
  ensureFileAccessPermission(filePath);
}
