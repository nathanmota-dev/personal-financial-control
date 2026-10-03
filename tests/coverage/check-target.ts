import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { metrics } from "./contracts";
import type { Counter, CoverageTargetReport } from "./contracts";

export function productionFiles(root: string): string[] {
  function scan(directory: string): string[] {
    return readdirSync(path.join(root, directory), {
      withFileTypes: true,
    }).flatMap((entry) => {
      const relative = `${directory}/${entry.name}`;
      if (entry.isDirectory())
        return /^(?:__tests__|tests?|node_modules)$/.test(entry.name)
          ? []
          : scan(relative);
      return /\.(?:[cm]?[jt]sx?)$/.test(entry.name) &&
        !/\.d\.(?:[cm]?ts)$/.test(entry.name) &&
        !/\.(?:test|spec)\./.test(entry.name)
        ? [relative]
        : [];
    });
  }
  return [
    ...["app", "components", "hooks", "lib"].flatMap(scan),
    "proxy.ts",
  ].sort();
}

function validCounter(value: unknown): value is Counter {
  if (!value || typeof value !== "object") return false;
  const counter = value as Counter;
  return (
    [counter.total, counter.covered, counter.skipped].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) &&
    counter.covered <= counter.total &&
    counter.skipped <= counter.total &&
    (counter.pct === "Unknown"
      ? counter.total === 0
      : typeof counter.pct === "number" &&
        Number.isFinite(counter.pct) &&
        counter.pct >= 0 &&
        counter.pct <= 100)
  );
}

export function checkTarget(
  input: unknown,
  expectedFiles: string[],
  root: string,
): CoverageTargetReport {
  const report: CoverageTargetReport = {
    passed: false,
    files: {},
    failures: [],
  };
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    report.failures.push("Invalid coverage report: expected an object.");
    return report;
  }
  const entries = new Map(
    Object.entries(input).map(([file, value]) => [
      file === "total"
        ? file
        : path
            .relative(root, path.resolve(root, file))
            .split(path.sep)
            .join("/"),
      value,
    ]),
  );
  for (const file of ["total", ...expectedFiles]) {
    const value = entries.get(file);
    if (!value || typeof value !== "object") {
      report.failures.push(`Missing coverage: ${file}`);
      continue;
    }
    const percentages = {} as CoverageTargetReport["files"][string];
    report.files[file] = percentages;
    for (const metric of metrics) {
      const counter = (value as Record<string, unknown>)[metric];
      if (!validCounter(counter)) {
        report.failures.push(`Invalid counter: ${file} (${metric})`);
        continue;
      }
      percentages[metric] =
        counter.total === 0 ? null : (counter.covered / counter.total) * 100;
      // Integer counts are authoritative; the rounded pct field cannot promote 80%.
      if (counter.total > 0 && counter.covered * 5 <= counter.total * 4) {
        report.failures.push(
          `${file}: ${metric} ${counter.covered}/${counter.total} must exceed 80%.`,
        );
      }
    }
  }
  for (const file of entries.keys()) {
    if (file !== "total" && !expectedFiles.includes(file))
      report.failures.push(`Unexpected coverage file: ${file}`);
  }
  const totals = entries.get("total") as Record<string, unknown> | undefined;
  for (const metric of metrics) {
    const total = totals?.[metric];
    if (!validCounter(total)) continue;
    for (const field of ["covered", "total", "skipped"] as const) {
      let sum = 0;
      let valid = true;
      for (const file of expectedFiles) {
        const counter = (
          entries.get(file) as Record<string, unknown> | undefined
        )?.[metric];
        if (!validCounter(counter)) {
          valid = false;
          break;
        }
        sum += counter[field];
      }
      if (valid && sum !== total[field])
        report.failures.push(`Inconsistent total: ${metric}.${field}`);
    }
  }
  report.passed = report.failures.length === 0;
  return report;
}

export function runTarget(root = process.cwd()) {
  const files = productionFiles(root);
  const map = JSON.parse(
    readFileSync(path.join(root, "tests/coverage-map.json"), "utf8"),
  ) as Record<string, string[]>;
  if (JSON.stringify(Object.keys(map).sort()) !== JSON.stringify(files))
    throw new Error(
      "Coverage map must contain every production file exactly once.",
    );
  for (const [source, suites] of Object.entries(map)) {
    if (
      !Array.isArray(suites) ||
      suites.some(
        (suite) => typeof suite !== "string" || !/^tests\//.test(suite),
      )
    )
      throw new Error(`Invalid suites for ${source}`);
    for (const suite of suites) readFileSync(path.join(root, suite));
  }
  const coverage = JSON.parse(
    readFileSync(path.join(root, "coverage/coverage-summary.json"), "utf8"),
  );
  const result = checkTarget(coverage, files, root);
  mkdirSync(path.join(root, "reports"), { recursive: true });
  writeFileSync(
    path.join(root, "reports/coverage-target.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  const rows = Object.entries(result.files).map(
    ([file, counters]) =>
      `| ${file} | ${metrics.map((metric) => (counters[metric] === null ? "não aplicável" : counters[metric]?.toFixed(4) + "%")).join(" | ")} |`,
  );
  writeFileSync(
    path.join(root, "reports/coverage-target.md"),
    [
      `# Coverage target: ${result.passed ? "passed" : "failed"}`,
      "",
      "Every executable metric must strictly exceed 80%; percentages use covered/total counts.",
      "",
      "| File | Lines | Statements | Functions | Branches |",
      "| --- | --- | --- | --- | --- |",
      ...rows,
      "",
      ...result.failures.map((failure) => `- ${failure}`),
      "",
    ].join("\n"),
  );
  console.log(
    `Coverage target: ${result.passed ? "passed" : "failed"}; ${files.length} files, ${result.failures.length} failures. See reports/coverage-target.md.`,
  );
  return result.passed ? 0 : 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    process.exitCode = runTarget();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
  }
}
