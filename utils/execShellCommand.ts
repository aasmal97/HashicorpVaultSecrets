import * as fs from "fs";
import * as path from "path";
import { exec, spawn } from "child_process";
export function execShellCommand(
  cmd: string,
  options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  }
) {
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      {
        cwd: options?.cwd,
        env: options?.env,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.warn(error.message);
          reject(error.message);
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
