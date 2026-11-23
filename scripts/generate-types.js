"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const typesDirectory = path.join(__dirname, "../types");
const source = fs.readFileSync(path.join(typesDirectory, "index.d.ts"), "utf8").replace(/\r\n/g, "\n");
const sourceExport = /export = MockAdapter;\s*$/;
assert.match(source, sourceExport);

// Keep both module declarations in sync, with Axios resolved in the caller's mode.
const output = [
  "// Generated from index.d.ts by scripts/generate-types.js. Do not edit directly.",
  source.replace(sourceExport, "export default MockAdapter;\n"),
].join("\n");
const target = path.join(typesDirectory, "index.d.mts");
if (process.argv.includes("--check")) {
  assert.equal(fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n"), output,
    "Run npm run build:types after changing types/index.d.ts");
} else {
  fs.writeFileSync(target, output);
}
