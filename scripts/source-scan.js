"use strict";
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { InputError, EXTENSIONS, TEST_PATTERN, inside, relative } = require("./config.js");

function physicalLines(text) {
  return text ? text.split(/\r\n|\n|\r/).length - Number(/(?:\r\n|\n|\r)$/.test(text)) : 0;
}
function scanFunctions(text, file) {
  const kind = /\.(jsx|tsx)$/.test(file) ? ts.ScriptKind.TSX : /\.[cm]?js$/.test(file) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  if (source.parseDiagnostics.length) throw new InputError(`Cannot parse ${file}: ${ts.flattenDiagnosticMessageText(source.parseDiagnostics[0].messageText, " ")}`);
  const functions = [];
  function visit(node) {
    if (ts.isFunctionLike(node) && node.body) {
      const startLine = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      const endLine = source.getLineAndCharacterOfPosition(node.end).line + 1;
      const name = node.name?.getText(source) || node.parent?.name?.getText(source) || "anonymous";
      functions.push({ file, name, startLine, endLine, lines: endLine - startLine + 1 });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return functions;
}
function scanSources(root, project) {
  const files = {}, functions = [];
  function recordFile(absolute) {
    const file = relative(root, absolute);
    if (TEST_PATTERN.test(file) || !EXTENSIONS.has(path.extname(file))) return;
    if (Object.hasOwn(files, file)) throw new InputError(`Overlapping source roots: ${file}`);
    const text = fs.readFileSync(absolute, "utf8");
    files[file] = physicalLines(text);
    functions.push(...scanFunctions(text, file));
  }
  function visit(directory) {
    if (!fs.existsSync(directory)) throw new InputError(`Missing source path: ${directory}`);
    if (fs.lstatSync(directory).isSymbolicLink()) throw new InputError(`Source root is a symlink: ${directory}`);
    if (fs.statSync(directory).isFile()) { recordFile(directory); return; }
    if (!fs.statSync(directory).isDirectory()) throw new InputError(`Invalid source path: ${directory}`);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink() || ["node_modules", "coverage", "dist", "build"].includes(entry.name)) continue;
      const absolute = path.join(directory, entry.name), file = relative(root, absolute);
      if (TEST_PATTERN.test(file)) continue;
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) recordFile(absolute);
    }
  }
  for (const sourceRoot of project.sourceRoots) visit(inside(root, sourceRoot));
  if (!Object.keys(files).length) throw new InputError(`No production JS/TS sources in ${project.name}.`);
  return { files, functions };
}
module.exports = { physicalLines, scanFunctions, scanSources };
