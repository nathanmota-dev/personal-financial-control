import { basename, join } from "node:path";
import { parseArgs } from "node:util";

import type { AppDb } from "@/lib/db";
import type { PluggyApi } from "@/lib/interfaces/pluggy";
import type { CutoverCliIo, CutoverCommand, CutoverPlan, CutoverReport, CutoverTableCounts } from "@/lib/interfaces/pluggy-cutover";
import { updateAccount } from "@/lib/server/accounts";
import { DomainError } from "@/lib/server/errors";
import { applyCutoverPlan } from "./apply";
import { compareCutoverReports, renderCutoverComparison } from "./compare";
import { buildCutoverPlan } from "./plan";
import { buildCutoverReport } from "./report";

type CutoverCliDeps = { db: AppDb; client: PluggyApi | null; databaseUrl: string; io: CutoverCliIo; rootDirectory: string };

const usage = () => new DomainError("CUTOVER_INVALID_ARGUMENTS", "Usage: pluggy:cutover [clean] [--dry-run | --apply --confirm-target=<name>] | report --label=<name> | compare --before=<name> --after=<name> | adjust --account-id=<id> --initial-balance-cents=<n> [--apply --confirm-target=<name>]");

/** The name to pass back in `--confirm-target`. It never includes credentials. */
export function databaseTargetName(url: string) {
  return url.startsWith("file:") ? basename(url.slice("file:".length)) : new URL(url).hostname;
}

function readFlags(argv: string[]) {
  try {
    return parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        apply: { type: "boolean", default: false },
        "dry-run": { type: "boolean", default: false },
        "confirm-target": { type: "string" },
        label: { type: "string" },
        before: { type: "string" },
        after: { type: "string" },
        "account-id": { type: "string" },
        "initial-balance-cents": { type: "string" },
      },
    });
  } catch {
    throw usage();
  }
}

function required(value: string | undefined) {
  if (!value) throw usage();
  return value;
}

/** The name becomes a file name, so it cannot be allowed to leave the report directory. */
function reportName(value: string | undefined) {
  if (!/^[\w-]+$/.test(required(value))) throw usage();
  return value!;
}

function parseCents(value: string | undefined) {
  if (!/^-?\d+$/.test(required(value))) throw usage();
  return Number(value);
}

export function parseCutoverArgs(argv: string[]): CutoverCommand {
  const { values, positionals } = readFlags(argv);
  const [name = "clean", ...rest] = positionals;
  if (rest.length || (values.apply && values["dry-run"])) throw usage();
  const write = { apply: Boolean(values.apply), confirmTarget: values["confirm-target"] };
  switch (name) {
    case "clean": return { command: "clean", ...write };
    case "report": return { command: "report", label: reportName(values.label) };
    case "compare": return { command: "compare", before: reportName(values.before), after: reportName(values.after) };
    case "adjust": return { command: "adjust", accountId: required(values["account-id"]), initialBalanceCents: parseCents(values["initial-balance-cents"]), ...write };
    default: throw usage();
  }
}

export function assertTargetConfirmed(target: string, confirmTarget: string | undefined) {
  if (confirmTarget !== target) {
    throw new DomainError("CUTOVER_TARGET_NOT_CONFIRMED", `Refusing to write. Pass --confirm-target=${target} to confirm this database.`);
  }
}

function printCounts(io: CutoverCliIo, counts: CutoverTableCounts) {
  for (const [table, count] of Object.entries(counts)) io.log(`  ${table}: ${count}`);
}

function printPlan(io: CutoverCliIo, plan: CutoverPlan) {
  for (const { window, counts } of plan.accounts) {
    io.log(`${window.accountName} (cutoff ${window.cutoffDate})`);
    printCounts(io, counts);
  }
  io.log("Total");
  printCounts(io, plan.totals);
  io.log(`Bank records kept: ${Object.entries(plan.preserved).map(([name, count]) => `${name} ${count}`).join(", ")}`);
  io.log(`Warnings (details in the report): ${Object.entries(plan.warnings).map(([name, rows]) => `${name} ${rows.length}`).join(", ")}`);
}

async function runClean(command: Extract<CutoverCommand, { command: "clean" }>, deps: CutoverCliDeps, target: string) {
  if (command.apply) assertTargetConfirmed(target, command.confirmTarget);
  deps.io.log(command.apply ? "Mode: apply" : "Mode: dry run, nothing will be written");
  const plan = await buildCutoverPlan(deps.db);
  printPlan(deps.io, plan);
  if (!command.apply) return deps.io.log(`To write: --apply --confirm-target=${target}`);
  await applyCutoverPlan(deps.db, plan);
  deps.io.log("Cleanup applied.");
}

async function runAdjust(command: Extract<CutoverCommand, { command: "adjust" }>, deps: CutoverCliDeps, target: string) {
  if (!command.apply) return deps.io.log(`Dry run: account ${command.accountId} would get initial balance ${command.initialBalanceCents} cents. To write: --apply --confirm-target=${target}`);
  assertTargetConfirmed(target, command.confirmTarget);
  await updateAccount({ id: command.accountId, initialBalanceCents: command.initialBalanceCents }, deps.db);
  deps.io.log("Initial balance updated.");
}

const reportPath = (deps: CutoverCliDeps, target: string, name: string) => join(deps.rootDirectory, ".local", "pluggy-cutover", target, name);

async function readReport(deps: CutoverCliDeps, target: string, label: string) {
  return JSON.parse(await deps.io.readFile(reportPath(deps, target, `${label}.json`))) as CutoverReport;
}

async function runReport(label: string, deps: CutoverCliDeps, target: string) {
  const report = await buildCutoverReport(deps.db, deps.client, label);
  const path = reportPath(deps, target, `${label}.json`);
  await deps.io.writeFile(path, JSON.stringify(report, null, 2));
  if (!report.bankAvailable) deps.io.log("Pluggy credentials are missing, so the bank comparisons were skipped.");
  deps.io.log(`Report written to ${path}`);
}

async function runCompare(before: string, after: string, deps: CutoverCliDeps, target: string) {
  const comparison = compareCutoverReports(await readReport(deps, target, before), await readReport(deps, target, after));
  const path = reportPath(deps, target, `${before}-${after}.md`);
  await deps.io.writeFile(path, renderCutoverComparison(comparison));
  deps.io.log(`Installments outside the window that changed: ${comparison.changedInstallments.length}`);
  deps.io.log(`Comparison written to ${path}`);
}

export async function runCutoverCli(command: CutoverCommand, deps: CutoverCliDeps) {
  const target = databaseTargetName(deps.databaseUrl);
  deps.io.log(`Database target: ${target}`);
  switch (command.command) {
    case "clean": return runClean(command, deps, target);
    case "adjust": return runAdjust(command, deps, target);
    case "report": return runReport(command.label, deps, target);
    case "compare": return runCompare(command.before, command.after, deps, target);
  }
}
