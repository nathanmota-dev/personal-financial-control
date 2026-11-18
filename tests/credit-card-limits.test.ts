import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildCreditCardLimitView, creditCardLimitSegments, creditCardLimitUsedPercent } from "@/lib/credit-card-limit";
import { pluggyAccountLinks, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteAccount } from "@/lib/interfaces/pluggy";
import { archiveAccount, createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardCharge, getCreditCardLimits } from "@/lib/server/credit-card";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { saveCreditCardLimit } from "@/lib/server/credit-card/limits";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { remoteCardLimit } from "@/lib/server/pluggy/remote";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;

const NOW = new Date("2026-11-17T12:00:00.000Z");
const invoice = (month: string, totalCents: number) => ({ month, totalCents, status: null });
const remoteCard = (creditData: PluggyRemoteAccount["creditData"], updatedAt: string | null = "2026-11-16T09:30:00.000Z"): PluggyRemoteAccount => ({ id: "remote-card", type: "CREDIT", name: "Cartão", updatedAt, creditData });

let database: Database;
let cardId: string;
let checkingId: string;

beforeEach(async () => {
  database = await createTestDatabase();
  checkingId = (await createAccount({ name: "Conta", type: "checking", initialBalanceCents: 0 }, database.db)).id;
  cardId = (await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 4, creditDueDay: 10 }, database.db)).id;
  pluggyRuntime().syncRunning = false;
});

afterEach(async () => {
  database.db.$client.close();
  await database.cleanup();
});

describe("card limit view", () => {
  it("splits what is used between the current invoice and later installments", () => {
    const view = buildCreditCardLimitView({ limitCents: 100400, availableCents: 4580, collectedOn: "2026-11-16", invoice: invoice("2026-12", 45918) });
    expect(view).toEqual({ limitCents: 100400, availableCents: 4580, usedCents: 95820, currentInvoiceMonth: "2026-12", currentInvoiceCents: 45918, committedCents: 49902, collectedOn: "2026-11-16" });
    expect(creditCardLimitUsedPercent(view)).toBe(95);
    expect(creditCardLimitSegments(view).map(({ key, amountCents, percent, width }) => ({ key, amountCents, percent, width }))).toEqual([
      { key: "invoice", amountCents: 45918, percent: 45.7, width: 45.7 },
      { key: "committed", amountCents: 49902, percent: 49.7, width: 49.7 },
      { key: "available", amountCents: 4580, percent: 4.6, width: 4.6 },
    ]);
  });

  it("never lets the invoice exceed what the bank reports as used", () => {
    const view = buildCreditCardLimitView({ limitCents: 10000, availableCents: 8000, collectedOn: "2026-11-16", invoice: invoice("2026-12", 5000) });
    expect(view).toMatchObject({ usedCents: 2000, currentInvoiceCents: 2000, committedCents: 0 });
    expect(buildCreditCardLimitView({ limitCents: 10000, availableCents: 10000, collectedOn: "2026-11-16", invoice: invoice("2026-12", -300) })).toMatchObject({ usedCents: 0, currentInvoiceCents: 0 });
  });

  it("scales the bar to what is used when the card is above its limit", () => {
    const view = buildCreditCardLimitView({ limitCents: 10000, availableCents: -2500, collectedOn: "2026-11-16", invoice: invoice("2026-12", 12500) });
    expect(view).toMatchObject({ usedCents: 12500, currentInvoiceCents: 12500, committedCents: 0 });
    expect(creditCardLimitSegments(view).map(({ key, percent, width }) => ({ key, percent, width }))).toEqual([
      { key: "invoice", percent: 125, width: 100 },
      { key: "committed", percent: 0, width: 0 },
      { key: "available", percent: 0, width: 0 },
    ]);
    expect(creditCardLimitUsedPercent({ ...view, limitCents: 0 })).toBe(0);
  });
});

describe("remote card limit", () => {
  it("reads the limit and what is available in cents", () => {
    expect(remoteCardLimit(remoteCard({ creditLimit: 1004, availableCreditLimit: 45.8 }), NOW)).toEqual({ limitCents: 100400, availableCents: 4580, collectedAt: new Date("2026-11-16T09:30:00.000Z") });
    expect(remoteCardLimit(remoteCard({ creditLimit: 1000, availableCreditLimit: -12.5 }, null), NOW)).toEqual({ limitCents: 100000, availableCents: -1250, collectedAt: NOW });
  });

  it("ignores cards that do not report both values", () => {
    expect(remoteCardLimit(remoteCard(null), NOW)).toBeNull();
    expect(remoteCardLimit(remoteCard({ creditLimit: 1000, availableCreditLimit: null }), NOW)).toBeNull();
    expect(remoteCardLimit(remoteCard({ creditLimit: 0, availableCreditLimit: 0 }), NOW)).toBeNull();
  });
});

describe("card limit sync", () => {
  let accounts: PluggyRemoteAccount[];

  function api(): PluggyApi {
    return {
      getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED" })),
      listAccounts: vi.fn(async () => accounts),
      listTransactions: vi.fn(async () => []),
      listBills: vi.fn(async () => []),
      listInvestments: vi.fn(async () => []),
    };
  }

  beforeEach(async () => {
    const [{ id: itemId }] = await database.db.insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
    await database.db.insert(pluggyAccountLinks).values([
      { itemId, externalAccountId: "remote-bank", accountId: checkingId, remoteName: "Conta", kind: "bank", cutoffDate: "2026-01-01" },
      { itemId, externalAccountId: "remote-card", accountId: cardId, remoteName: "Cartão", kind: "credit", cutoffDate: "2026-01-01" },
    ]);
    accounts = [{ id: "remote-bank", type: "BANK", name: "Conta" }, remoteCard({ creditLimit: 1004, availableCreditLimit: 45.8 })];
  });

  const limits = () => database.db.query.creditCardLimits.findMany();

  it("keeps one row per card with the latest report", async () => {
    const first = await runPluggySync({ db: database.db, client: api() });
    expect(first.summary?.counts).toMatchObject({ cardLimits: 1 });
    expect(first.summary?.counts.cardLimitsMissing).toBeUndefined();
    accounts = [accounts[0], remoteCard({ creditLimit: 1500, availableCreditLimit: 900 }, "2026-11-17T08:00:00.000Z")];
    await runPluggySync({ db: database.db, client: api() });
    expect(await limits()).toMatchObject([{ accountId: cardId, limitCents: 150000, availableCents: 90000, collectedAt: new Date("2026-11-17T08:00:00.000Z") }]);
  });

  it("writes nothing on a dry run and reports cards without a limit", async () => {
    expect((await runPluggySync({ db: database.db, client: api(), dryRun: true })).summary?.counts).toMatchObject({ cardLimits: 1 });
    expect(await limits()).toEqual([]);
    accounts = [accounts[0], remoteCard(null)];
    expect((await runPluggySync({ db: database.db, client: api() })).summary?.counts).toMatchObject({ cardLimitsMissing: 1 });
    expect(await limits()).toEqual([]);
  });

  it("does not reject the account when the credit block is malformed", async () => {
    accounts = [accounts[0], { ...remoteCard(null), creditData: "broken" } as unknown as PluggyRemoteAccount];
    const run = await runPluggySync({ db: database.db, client: api() });
    expect(run.status).toBe("success");
    expect(run.summary?.counts).toMatchObject({ cardLimitsMissing: 1 });
  });
});

describe("card limits query", () => {
  async function charge(description: string, firstInvoiceMonth: string, totalAmountCents: number, installmentCount: number) {
    const category = await createCategory({ name: description, group: "variable_expense" }, database.db);
    await createCreditCardCharge({ accountId: cardId, categoryId: category.id, description, purchaseDate: "2026-10-20", totalAmountCents, installmentCount, firstInvoiceMonth }, database.db);
  }

  beforeEach(async () => {
    await charge("Mercado", "2026-11", 5000, 1);
    await charge("Notebook", "2026-12", 30000, 3);
    await saveCreditCardLimit(database.db, cardId, { limitCents: 100000, availableCents: 65000, collectedAt: new Date("2026-11-16T02:00:00.000Z") }, NOW);
  });

  it("returns nothing before the bank reports a limit", async () => {
    const empty = await createTestDatabase();
    try {
      expect(await getCreditCardLimits("2026-11-17", empty.db)).toEqual({});
    } finally {
      empty.db.$client.close();
      await empty.cleanup();
    }
  });

  it("uses the invoice still to be paid once the current one is past due", async () => {
    expect(await getCreditCardLimits("2026-11-17", database.db)).toEqual({
      [cardId]: { limitCents: 100000, availableCents: 65000, usedCents: 35000, currentInvoiceMonth: "2026-12", currentInvoiceCents: 10000, committedCents: 25000, collectedOn: "2026-11-15" },
    });
  });

  it("skips an invoice paid before its due date", async () => {
    expect((await getCreditCardLimits("2026-11-08", database.db))[cardId]).toMatchObject({ currentInvoiceMonth: "2026-11", currentInvoiceCents: 5000 });
    await upsertCreditCardBill({ accountId: cardId, invoiceMonth: "2026-11", dueDate: "2026-11-10", statementTotalCents: 5000, currentChargesTotalCents: 5000 }, database.db);
    await createCreditCardBillPayment({ accountId: cardId, invoiceMonth: "2026-11", paymentAccountId: checkingId, amountCents: 5000, paymentDate: "2026-11-06", idempotencyKey: "paid-early" }, database.db);
    expect((await getCreditCardLimits("2026-11-08", database.db))[cardId]).toMatchObject({ currentInvoiceMonth: "2026-12", currentInvoiceCents: 10000, committedCents: 25000 });
  });

  it("leaves out archived cards", async () => {
    await archiveAccount(cardId, database.db);
    expect(await getCreditCardLimits("2026-11-17", database.db)).toEqual({});
  });
});
