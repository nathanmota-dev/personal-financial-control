import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { productionFiles } from "./check-target";

const root = process.cwd();
const production = productionFiles(root);
const map = Object.fromEntries(
  production.map((file) => [file, [] as string[]]),
);
function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sources(file)
      : /\.(?:test\.ts|cases\.tsx?)$/.test(file)
        ? [file]
        : [];
  });
}
function resolve(from: string, specifier: string) {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return;
  const base = specifier.startsWith("@/")
    ? specifier.slice(2)
    : path.normalize(path.join(path.dirname(from), specifier));
  return [
    base,
    ...[".ts", ".tsx", ".js", "/index.ts", "/index.tsx"].map(
      (extension) => base + extension,
    ),
  ].find((file) => existsSync(file) && !readdirIsDirectory(file));
}
function readdirIsDirectory(file: string) {
  try {
    readdirSync(file);
    return true;
  } catch {
    return false;
  }
}
function imports(file: string) {
  const text = readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const dependencies: string[] = [];
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      dependencies.push(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      dependencies.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return dependencies
    .map((specifier) => resolve(file, specifier))
    .filter((file): file is string => !!file);
}

for (const suite of sources("tests")) {
  if (suite.startsWith("tests/coverage/")) continue;
  const visited = new Set<string>();
  function walk(file: string) {
    if (visited.has(file)) return;
    visited.add(file);
    if (file in map) map[file].push(suite);
    for (const imported of imports(file)) walk(imported);
  }
  walk(suite);
}
for (const suites of Object.values(map)) suites.sort();
writeFileSync(
  path.join(root, "tests/coverage-map.json"),
  JSON.stringify(map, null, 2) + "\n",
);
console.log(
  `Mapped ${production.length} files. ${Object.values(map).filter((suites) => !suites.length).length} files have no consuming suite yet.`,
);
