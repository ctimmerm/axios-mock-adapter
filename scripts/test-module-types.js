"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const files = ["test/types/cjs.cts"];
// Older Axios releases only declare a CommonJS entry. Its dual declarations
// are the source of the ESM/CJS incompatibility these fixtures exercise.
if (require("axios/package.json").exports) {
  files.push("test/types/esm.mts");
}

for (const mode of ["Node16", "NodeNext"]) {
  const result = spawnSync(process.execPath, [
    require.resolve("typescript/bin/tsc"),
    ...files,
    "--module", mode,
    "--moduleResolution", mode,
    "--target", "ES2022",
    "--strict",
    "--exactOptionalPropertyTypes",
    "--noEmit",
  ], { cwd: path.join(__dirname, ".."), stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
