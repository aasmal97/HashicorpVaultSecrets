import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
export function execShellCommand(cmd: string, cwd?: string) {
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      {
        cwd: cwd,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
        const output = stdout ? stdout : stderr;
        console.log(output);
        resolve(output);
      }
    );
  });
}
export function findPackageJson(currentPath: string): string | null {
  const packageJsonPath = path.join(currentPath, "package.json");

  if (fs.existsSync(packageJsonPath)) {
    return currentPath;
  }

  const parentDir = path.dirname(currentPath);
  if (parentDir === currentPath) {
    return null;
  }

  return findPackageJson(parentDir);
}
