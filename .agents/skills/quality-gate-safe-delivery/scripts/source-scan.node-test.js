"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const S = require("./source-scan.js"), H = require("./test-helpers.js");
test("physical lines handle empty, CRLF, final and missing newline", () => {
  for (const [text, expected] of [["", 0], ["one\n", 1], ["one\r\ntwo\r\n", 2], ["one\ntwo", 2], ["one\rtwo\r", 2]]) assert.equal(S.physicalLines(text), expected);
});
test("AST counts complete signatures and callbacks missed by source regexes", () => {
  const cases = [
    `items.map(() => {\n${"  work();\n".repeat(100)}});`,
    `const work = () => (\n${"  run(),\n".repeat(100)}  result\n);`,
    `const object = { work: () => {\n${"  run();\n".repeat(100)}} };`,
    `function work(\n  first,\n  second,\n  third\n) {\n${"  run();\n".repeat(95)}}`,
  ];
  for (const text of cases) assert.ok(S.scanFunctions(text, "src/example.ts")[0].lines > 100);
});
test("function boundaries distinguish 100 and 101 lines", () => {
  for (const length of [100, 101]) assert.equal(S.scanFunctions(`function work() {\n${"  run();\n".repeat(length - 2)}}`, "src/file.js")[0].lines, length);
});
test("methods, constructors, accessors, function expressions and arrows are scanned", () => {
  const source = "class Work { constructor() {} method() {} get value() {return 1} set value(v) {} }\nconst expression = function () {}; const arrow = () => 1;";
  assert.equal(S.scanFunctions(source, "src/file.ts").length, 6);
});
test("invalid syntax fails instead of dropping functions", () => assert.throws(() => S.scanFunctions("function work( {", "src/invalid.ts"), /Cannot parse/));
test("source scan excludes tests/generated files, retains declarations and skips symlinks", (t) => {
  const root = H.temporary(t);
  H.write(root, "src/index.js", "one();\n"); H.write(root, "src/types.d.ts", "declare const value: number;\n");
  for (const file of ["src/test/a.js", "src/tests/b.js", "src/__tests__/c.js", "src/file.spec.ts", "src/file.test.ts", "src/dist/a.js"]) H.write(root, file, "ignored");
  fs.symlinkSync(path.join(root, "src/index.js"), path.join(root, "src/link.js"));
  assert.deepEqual(Object.keys(S.scanSources(root, H.project()).files), ["src/index.js", "src/types.d.ts"]);
});
test("source roots cannot overlap or escape the repository", (t) => {
  const root = H.temporary(t); H.write(root, "src/index.js", "work();");
  assert.throws(() => S.scanSources(root, { ...H.project(), sourceRoots: ["src", "src"] }), /Overlapping/);
  assert.throws(() => S.scanSources(root, { ...H.project(), sourceRoots: ["../"] }), /escapes/);
});
