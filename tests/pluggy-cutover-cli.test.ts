import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pluggySettings } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteBill, PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import type { CutoverReport } from "@/lib/interfaces/pluggy-cutover";
import { upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { createCreditCardCharge } from "@/lib/server/credit-card/mutations";
import { getAccountById } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { compareCutoverReports, renderCutoverComparison } from "@/lib/server/pluggy/cutover/compare";
import { assertTargetConfirmed, databaseTargetName, parseCutoverArgs, runCutoverCli } from "@/lib/server/pluggy/cutover/cli";
import { buildCutoverReport } from "@/lib/server/pluggy/cutover/report";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { createRecurringTemplate, generateRecurringTransactions } from "@/lib/server/recurring";
import { createTransaction } from "@/lib/server/transactions";
import { seedCutoverDatabase, snapshotAllTables } from "@/tests/helpers/pluggy-cutover";

type Seed = Awaited<ReturnType<typeof seedCutoverDatabase>>;

const URL_TARGET = "copia-org.turso.io";
const CONFIRM = `--confirm-target=${URL_TARGET}`;

let seed: Seed;
let files: Map<string, string>;
let logs: string[];

beforeEach(async () => {
  seed = await seedCutoverDatabase({ bankCutoff: "2026-03-01", cardCutoff: "2026-03-01" });
  files = new Map();
  logs = [];
  pluggyRuntime().syncRunning = false;
});

afterEach(async () => {
  seed.db.$client.close();
  await seed.cleanup();
});

function deps(client: PluggyApi | null = null) {
  return {
    db: seed.db,
    client,
    databaseUrl: `libsql://${URL_TARGET}`,
    rootDirectory: "/root",
    io: {
      log: (message: string) => void logs.push(message),
      readFile: async (path: string) => files.get(path) ?? "",
      writeFile: async (path: string, content: string) => void files.set(path, content),
    },
  };
}

const run = (argv: string[], client: PluggyApi | null = null) => runCutoverCli(parseCutoverArgs(argv), deps(client));
const manualExpense = (date = "2026-03-10") => createTransaction({ accountId: seed.checking.id, categoryId: seed.category.id, type: "expense", status: "posted", amountCents: 10000, transactionDate: date, competenceMonth: date.slice(0, 7), description: "manual" }, seed.db);
const report = (client: PluggyApi | null = null, label = "x") => buildCutoverReport(seed.db, client, label);

function api(balance: number | null, bills: PluggyRemoteBill[] = [], transactions: Record<string, PluggyRemoteTransaction[]> = {}): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED" })),
    listAccounts: vi.fn(async () => [{ id: "remote-bank", type: "BANK", name: "Conta", balance }, { id: "remote-card", type: "CREDIT", name: "Cartão" }]),
    listTransactions: vi.fn(async (id: string) => transactions[id] ?? []),
    listBills: vi.fn(async () => bills),
    listInvestments: vi.fn(async () => []),
  };
}

const remoteBill = (month: string, totalAmount: number, payments: PluggyRemoteBill["payments"] = []): PluggyRemoteBill => ({ id: `bill-${month}`, dueDate: `${month}-12T00:00:00.000Z`, billClosingDate: `${month}-05T00:00:00.000Z`, totalAmount, payments });

describe("cutover arguments", () => {
  it("defaults to a dry-run cleanup", () => {
    expect(parseCutoverArgs([])).toEqual({ command: "clean", apply: false, confirmTarget: undefined });
    expect(parseCutoverArgs(["--dry-run"])).toMatchObject({ command: "clean", apply: false });
  });

  it("parses the other commands", () => {
    expect(parseCutoverArgs(["clean", "--apply", "--confirm-target=a"])).toEqual({ command: "clean", apply: true, confirmTarget: "a" });
    expect(parseCutoverArgs(["report", "--label=before"])).toEqual({ command: "report", label: "before" });
    expect(parseCutoverArgs(["compare", "--before=a", "--after=b"])).toEqual({ command: "compare", before: "a", after: "b" });
    expect(parseCutoverArgs(["adjust", "--account-id=id", "--initial-balance-cents=-5"])).toMatchObject({ command: "adjust", accountId: "id", initialBalanceCents: -5, apply: false });
  });

  it.each([
    [["--apply", "--dry-run"]],
    [["--unknown"]],
    [["nope"]],
    [["clean", "extra"]],
    [["report"]],
    [["report", "--label=../../etc"]],
    [["compare", "--before=a"]],
    [["adjust", "--account-id=id"]],
    [["adjust", "--account-id=id", "--initial-balance-cents=1.5"]],
  ])("rejects %j", (argv) => {
    expect(() => parseCutoverArgs(argv)).toThrow(expect.objectContaining({ code: "CUTOVER_INVALID_ARGUMENTS" }));
  });

  it("names the target without credentials", () => {
    expect(databaseTargetName("libsql://db-org.turso.io?authToken=secret")).toBe("db-org.turso.io");
    expect(databaseTargetName("file:./.local/copy.db")).toBe("copy.db");
  });

  it("requires the exact target", () => {
    expect(() => assertTargetConfirmed("a", undefined)).toThrow(expect.objectContaining({ code: "CUTOVER_TARGET_NOT_CONFIRMED" }));
    expect(() => assertTargetConfirmed("a", "b")).toThrow(expect.objectContaining({ code: "CUTOVER_TARGET_NOT_CONFIRMED" }));
    expect(() => assertTargetConfirmed("a", "a")).not.toThrow();
  });
});

describe("cutover commands", () => {
  it("prints the target and exact counts on a dry run, writing nothing", async () => {
    await manualExpense();
    const before = await snapshotAllTables(seed.db);
    await run([]);
    expect(logs[0]).toBe(`Database target: ${URL_TARGET}`);
    expect(logs).toContain("Mode: dry run, nothing will be written");
    expect(logs).toContain("  transactions: 1");
    expect(logs.at(-1)).toBe(`To write: --apply ${CONFIRM}`);
    expect(await snapshotAllTables(seed.db)).toBe(before);
    expect(files.size).toBe(0);
  });

  it.each([[["--apply"]], [["--apply", "--confirm-target=outro"]]])("refuses %j and writes nothing", async (argv) => {
    await manualExpense();
    const before = await snapshotAllTables(seed.db);
    await expect(run(argv)).rejects.toMatchObject({ code: "CUTOVER_TARGET_NOT_CONFIRMED" });
    expect(await snapshotAllTables(seed.db)).toBe(before);
  });

  it("applies with the target confirmed", async () => {
    await manualExpense();
    await run(["--apply", CONFIRM]);
    expect(logs.at(-1)).toBe("Cleanup applied.");
    expect(await seed.db.query.transactions.findMany()).toEqual([]);
  });

  it("only adjusts the initial balance when confirmed", async () => {
    await run(["adjust", `--account-id=${seed.checking.id}`, "--initial-balance-cents=700"]);
    expect((await getAccountById(seed.checking.id, seed.db)).initialBalanceCents).toBe(0);
    await expect(run(["adjust", `--account-id=${seed.checking.id}`, "--initial-balance-cents=700", "--apply"])).rejects.toMatchObject({ code: "CUTOVER_TARGET_NOT_CONFIRMED" });
    await run(["adjust", `--account-id=${seed.checking.id}`, "--initial-balance-cents=700", "--apply", CONFIRM]);
    expect((await getAccountById(seed.checking.id, seed.db)).initialBalanceCents).toBe(700);
  });

  it("writes reports under .local and says when the bank is unavailable", async () => {
    await run(["report", "--label=before"]);
    expect(logs).toContain("Pluggy credentials are missing, so the bank comparisons were skipped.");
    expect([...files.keys()]).toEqual([`/root/.local/pluggy-cutover/${URL_TARGET}/before.json`]);
    await run(["report", "--label=after"], api(0));
    await run(["compare", "--before=before", "--after=after"]);
    expect([...files.keys()]).toContain(`/root/.local/pluggy-cutover/${URL_TARGET}/before-after.md`);
    expect(logs).toContain("Installments outside the window that changed: 0");
  });
});

describe("cutover report", () => {
  it("totals income, expense, investment and category groups per month, without bill payments", async () => {
    const fixed = await createCategory({ name: "Aluguel", group: "fixed_expense" }, seed.db);
    const pending = await createCategory({ name: "A classificar", group: "variable_expense" }, seed.db);
    const invest = await createCategory({ name: "Aplicar", group: "investment" }, seed.db);
    const salary = await createCategory({ name: "Salário", group: "income" }, seed.db);
    const add = (type: "income" | "expense" | "investment_contribution", amountCents: number, categoryId: string | null, status: "posted" | "cancelled" = "posted", date = "2026-03-10") => createTransaction({ accountId: seed.checking.id, categoryId, type, status, amountCents, transactionDate: date, competenceMonth: date.slice(0, 7), description: type }, seed.db);
    await add("income", 500000, salary.id);
    await add("expense", 100000, fixed.id);
    await add("expense", 2000, seed.category.id);
    await add("expense", 300, null);
    await add("expense", 700, seed.category.id, "cancelled");
    await add("expense", 900, seed.category.id, "posted", "2026-02-10");
    await add("investment_contribution", 5000, invest.id);
    await createCreditCardCharge({ accountId: seed.card.id, categoryId: pending.id, description: "c", purchaseDate: "2026-02-20", totalAmountCents: 2000, installmentCount: 2, kind: "purchase", firstInvoiceMonth: "2026-02" }, seed.db);
    const { accounts, bankAvailable } = await report();
    expect(bankAvailable).toBe(false);
    const conta = accounts.find((row) => row.accountName === "Conta")!;
    expect(conta.months).toEqual([{ month: "2026-03", incomeCents: 500000, expenseCents: 102300, investmentCents: 5000, fixedCents: 100000, variableCents: 2000, uncategorizedCents: 300 }]);
    expect(conta.uncategorizedCount).toBe(1);
    const cartao = accounts.find((row) => row.accountName === "Cartão")!;
    expect(cartao.months).toEqual([expect.objectContaining({ month: "2026-03", expenseCents: 1000, uncategorizedCents: 1000 })]);
    expect(cartao.uncategorizedCount).toBe(1);
  });

  it("compares each invoice with the bank's bill", async () => {
    const add = (invoiceMonth: string, statementTotalCents: number) => upsertCreditCardBill({ accountId: seed.card.id, invoiceMonth, dueDate: `${invoiceMonth}-12`, statementTotalCents, currentChargesTotalCents: statementTotalCents }, seed.db);
    await add("2026-02", 100);
    await add("2026-03", 15000);
    await add("2026-04", 2000);
    await add("2026-05", 3000);
    const { accounts } = await report(api(0, [remoteBill("2026-03", 150), remoteBill("2026-04", 25), remoteBill("2026-06", 40)]));
    expect(accounts.find((row) => row.kind === "credit")!.invoices).toEqual([
      { invoiceMonth: "2026-03", appTotalCents: 15000, bankTotalCents: 15000, differenceCents: 0, status: "matched" },
      { invoiceMonth: "2026-04", appTotalCents: 2000, bankTotalCents: 2500, differenceCents: 500, status: "difference" },
      { invoiceMonth: "2026-05", appTotalCents: 3000, bankTotalCents: null, differenceCents: null, status: "missing_at_bank" },
      { invoiceMonth: "2026-06", appTotalCents: null, bankTotalCents: 4000, differenceCents: null, status: "missing_in_app" },
    ]);
    expect((await report()).accounts.find((row) => row.kind === "credit")!.invoices[0].status).toBe("bank_unavailable");
  });

  it("proposes an initial balance only when the bank differs", async () => {
    await manualExpense();
    const balance = async (value: number | null) => (await report(api(value))).accounts.find((row) => row.kind === "bank")!.balance;
    expect(await balance(-100)).toEqual({ appCents: -10000, bankCents: -10000, differenceCents: 0, proposedInitialBalanceCents: null });
    expect(await balance(50)).toEqual({ appCents: -10000, bankCents: 5000, differenceCents: 15000, proposedInitialBalanceCents: 15000 });
    expect(await balance(null)).toEqual({ appCents: -10000, bankCents: null, differenceCents: null, proposedInitialBalanceCents: null });
  });
});

describe("cutover comparison", () => {
  const straddling = (amountCents: number) => ({ chargeId: "c", accountId: "a", description: "atravessa", purchaseDate: "2026-02-02", totalAmountCents: 4000, installmentCount: 4, firstInvoiceMonth: "2026-02", outsideInstallments: [{ installmentNumber: 1, invoiceMonth: "2026-02", amountCents, onPaidBill: false }] });
  const reportWith = (partial: Partial<CutoverReport>) => ({ label: "x", bankAvailable: true, accounts: [], importedCharges: [], unmatchedBillPayments: 0, pendingCardPayments: 0, plan: { warnings: { straddlingCharges: [] } }, ...partial }) as unknown as CutoverReport;
  const rebuilt = (totalAmountCents: number, amountCents: number) => ({ accountId: "a", totalAmountCents, installmentCount: 4, firstInvoiceMonth: "2026-02", installments: [{ installmentNumber: 1, amountCents }] });
  const before = reportWith({ plan: { warnings: { straddlingCharges: [straddling(1000)] } } } as Partial<CutoverReport>);

  it("reports nothing when the rebuilt installment is the same, preferring the closest total", () => {
    expect(compareCutoverReports(before, reportWith({ importedCharges: [rebuilt(9000, 7), rebuilt(4000, 1000)] })).changedInstallments).toEqual([]);
  });

  it("reports an installment that changed or never came back", () => {
    expect(compareCutoverReports(before, reportWith({ importedCharges: [rebuilt(4000, 1100)] })).changedInstallments).toEqual([expect.objectContaining({ beforeCents: 1000, afterCents: 1100 })]);
    expect(compareCutoverReports(before, reportWith({})).changedInstallments).toEqual([expect.objectContaining({ beforeCents: 1000, afterCents: null })]);
  });

  it("renders months, invoices, balances and changes", () => {
    const month = (expenseCents: number) => ({ month: "2026-03", incomeCents: 0, expenseCents, investmentCents: 0, fixedCents: 0, variableCents: 0, uncategorizedCents: 0 });
    const account = (expenseCents: number, proposed: number | null) => ({ accountId: "a", accountName: "Conta", kind: "bank", cutoffDate: "2026-03-01", months: [month(expenseCents)], invoices: [{ invoiceMonth: "2026-03", appTotalCents: 100, bankTotalCents: 100, differenceCents: 0, status: "matched" }], balance: { appCents: 1, bankCents: 2, differenceCents: 1, proposedInitialBalanceCents: proposed }, uncategorizedCount: 2 });
    const text = renderCutoverComparison(compareCutoverReports(
      reportWith({ accounts: [account(100, null)] as CutoverReport["accounts"], plan: before.plan }),
      reportWith({ accounts: [account(250, 9)] as CutoverReport["accounts"], unmatchedBillPayments: 3, pendingCardPayments: 4 }),
    ));
    expect(text).toContain("## Conta (cutoff 2026-03-01)");
    expect(text).toContain("| 2026-03 | 0.00 | 1.00 |");
    expect(text).toContain("| 2026-03 | 1.00 | 1.00 | 0.00 | matched |");
    expect(text).toContain("Proposed initial balance: 9 cents.");
    expect(text).toContain("atravessa, installment 1 (2026-02): 10.00 -> -");
    expect(text).toContain("Unmatched bill payments: 3.");
    expect(text).toContain("Items in pending_card_payment: 4.");
    expect(renderCutoverComparison({ accounts: [], changedInstallments: [], unmatchedBillPayments: 0, pendingCardPayments: 0 })).toContain("None.");
  });
});

describe("full rehearsal on a synthetic database", () => {
  const debit = (id: string, day: string, amount: number, description: string): PluggyRemoteTransaction => ({ id, date: `${day}T15:00:00.000Z`, amount: -amount, type: "DEBIT", status: "POSTED", description, operationType: "OUTROS" });
  const income: PluggyRemoteTransaction = { id: "salario", date: "2026-03-05T15:00:00.000Z", amount: 5000, type: "CREDIT", status: "POSTED", description: "SALARIO", operationType: "OUTROS" };
  const purchase: PluggyRemoteTransaction = { id: "compra", date: "2026-03-20T15:00:00.000Z", amount: 150, type: "DEBIT", status: "POSTED", description: "LOJA", creditCardMetadata: { billId: "bill-2026-04" } };
  const counts = (run: Awaited<ReturnType<typeof runPluggySync>>) => run.summary?.counts ?? {};
  const createdCounts = ["bankOrdinary", "cardPurchases", "cardBills", "billPaymentsLinked"];

  it("cleans, syncs, reports and stays stable on a second sync", async () => {
    await seed.db.insert(pluggySettings).values({ ownerNames: JSON.stringify(["TITULAR"]) });
    await createRecurringTemplate({ accountId: seed.checking.id, categoryId: seed.category.id, type: "expense", amountCents: 10000, dayOfMonth: 10, startMonth: "2026-01", name: "Mercado fixo" }, seed.db);
    await generateRecurringTransactions("2026-03", seed.db);
    await manualExpense("2026-03-11");
    await createCreditCardCharge({ accountId: seed.card.id, categoryId: seed.category.id, description: "manual", purchaseDate: "2026-03-20", totalAmountCents: 15000, installmentCount: 1, kind: "purchase", firstInvoiceMonth: "2026-04" }, seed.db);
    await upsertCreditCardBill({ accountId: seed.card.id, invoiceMonth: "2026-04", dueDate: "2026-04-12", statementTotalCents: 14000, currentChargesTotalCents: 14000 }, seed.db);
    const client = api(4750, [remoteBill("2026-04", 150)], { "remote-bank": [income, debit("mercado", "2026-03-10", 100, "MERCADO"), debit("fatura", "2026-04-10", 150, "PAGAMENTO FATURA CARTAO")], "remote-card": [purchase] });

    await run(["report", "--label=before"], client);
    await run([]);
    await run(["--apply", CONFIRM]);
    expect(await seed.db.query.transactions.findMany()).toEqual([]);

    const first = await runPluggySync({ db: seed.db, client });
    expect(first.status).toBe("success");
    expect(counts(first)).toMatchObject({ bankOrdinary: 2, cardPurchases: 1, cardBills: 1, billPaymentsLinked: 1 });

    expect(await generateRecurringTransactions("2026-03", seed.db)).toEqual([]);
    const after = await report(client, "after");
    expect(after.accounts.find((row) => row.kind === "credit")!.invoices).toEqual([expect.objectContaining({ invoiceMonth: "2026-04", status: "matched" })]);
    expect(after.accounts.find((row) => row.kind === "bank")!.balance).toMatchObject({ appCents: 475000, bankCents: 475000, differenceCents: 0 });
    expect(after.accounts.find((row) => row.kind === "bank")!.months).toEqual(expect.arrayContaining([expect.objectContaining({ month: "2026-03", incomeCents: 500000, expenseCents: 10000 })]));
    expect(after.accounts.find((row) => row.kind === "bank")!.months.find((row) => row.month === "2026-04")?.expenseCents ?? 0).toBe(0);
    expect(after.unmatchedBillPayments).toBe(0);
    expect(after.plan.totals).toMatchObject({ transactions: 0, credit_card_charges: 0, credit_card_bills: 0, transfers: 0 });

    const snapshot = (await seed.db.query.transactions.findMany()).length;
    const second = await runPluggySync({ db: seed.db, client });
    expect(second.status).toBe("success");
    for (const name of createdCounts) expect(counts(second)).not.toHaveProperty(name);
    expect(await seed.db.query.transactions.findMany()).toHaveLength(snapshot);

    await run(["report", "--label=after"], client);
    await run(["compare", "--before=before", "--after=after"]);
    expect(logs).toContain("Installments outside the window that changed: 0");
  });
});
