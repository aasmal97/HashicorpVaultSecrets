import { findPackageJson } from "../utils/execShellCommand";
import * as esbuild from "esbuild";
export const build = async () => {
  //bundle node index file
  const rootPath = findPackageJson(__dirname);
  const command = "action/index.ts";
  const outPath = "dist/action/index.js";
  if (!rootPath) return console.log("No package.json found");
  await esbuild.build({
    entryPoints: [command],
    bundle: true,
    platform: "node",
    outfile: outPath,
    absWorkingDir: rootPath,
  });
};
if (require.main === module) build();
