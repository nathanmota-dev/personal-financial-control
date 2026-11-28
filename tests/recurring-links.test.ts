import { afterEach, describe, expect, it, vi } from "vitest";

import { pluggyAccountLinks, pluggyItems, recurringOccurrenceLinks, transactions } from "@/lib/db/schema";
import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardCharge, deleteCreditCardCharge } from "@/lib/server/credit-card";
import { readDashboardBills } from "@/lib/server/dashboard-bills";
import { listRecurringMatchCandidates } from "@/lib/server/recurring/candidates";
import {
  autoLinkRecurringOccurrences,
  createRecurringTemplate,
  generateRecurringTransactions,
  listPaidRecurringTemplateIds,
  listRecordedOccurrenceKeys,
  listRecurringLinkCandidates,
  listRecurringOccurrences,
  saveRecurringLinks,
} from "@/lib/server/recurring";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";
import { eq } from "drizzle-orm";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

/** A bank-owned account whose rules are paid by imported entries, as with Open Finance. */
async function seedBankLedger() {
  const { db, cleanup } = await createTestDatabase();
  cleanups.push(cleanup);
  const bank = await createAccount({ name: "Conta principal", type: "checking", initialBalanceCents: 0 }, db);
  const card = await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 3, creditDueDay: 10 }, db);
  const [item] = await db.insert(pluggyItems).values({ externalItemId: "item", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  await db.insert(pluggyAccountLinks).values({ itemId: item.id, externalAccountId: "remote", accountId: bank.id, remoteName: "Banco", kind: "bank", cutoffDate: "2026-01-01" });
  const energy = await createCategory({ name: "Energia", group: "fixed_expense" }, db);
  const church = await createCategory({ name: "Igreja", group: "fixed_expense" }, db);
  const cloud = await createCategory({ name: "Nuvem", group: "variable_expense" }, db);
  const rule = (description: string, categoryId: string, amountCents: number, dayOfMonth: number) =>
    createRecurringTemplate({ accountId: bank.id, categoryId, type: "expense", amountCents, description, dayOfMonth, startMonth: "2026-01" }, db);
  const light = await rule("Energia", energy.id, 50000, 15);
  const offer = await rule("Offer", church.id, 20000, 6);
  const google = await rule("Google", cloud.id, 1000, 12);
  const imported = (description: string, categoryId: string, amountCents: number, transactionDate: string) =>
    createTransaction({ accountId: bank.id, categoryId, type: "expense", amountCents, transactionDate, competenceMonth: transactionDate.slice(0, 7), description, status: "posted" }, db);
  const bill = await imported("CEMIG", energy.id, 50000, "2026-11-14");
  const tithe = await imported("Oferta", church.id, 25000, "2026-11-06");
  return { db, bank, card, energy, cloud, light, offer, google, bill, tithe };
}

describe("recurring occurrence links", () => {
  it("links an unambiguous bank entry when the month is opened, once", async () => {
    const { db, light, offer, bill } = await seedBankLedger();
    expect(await generateRecurringTransactions("2026-11", db)).toEqual([]);
    expect(await autoLinkRecurringOccurrences(["2026-11"], db)).toEqual([]);

    const { byTemplate, recordedKeys } = await listRecurringOccurrences("2026-11", db);
    expect(byTemplate[light.id]).toMatchObject({ recordedCents: 50000, entries: [{ id: bill.id, source: "auto", description: "CEMIG" }] });
    expect(byTemplate[offer.id]).toBeUndefined();
    expect(recordedKeys).toEqual([`${light.id}:2026-11`]);
  });

  it("links the rest by hand, including a card purchase, and keeps an undone automatic link undone", async () => {
    const { db, card, cloud, light, offer, google, bill, tithe } = await seedBankLedger();
    await generateRecurringTransactions("2026-11", db);
    const charge = await createCreditCardCharge({ accountId: card.id, categoryId: cloud.id, description: "GOOGLE CLOUD", purchaseDate: "2026-11-12", totalAmountCents: 1000, installmentCount: 1 }, db);

    const offerCandidates = await listRecurringLinkCandidates(offer.id, "2026-11", db);
    expect(offerCandidates.candidates[0]).toMatchObject({ id: tithe.id, isLinked: false, isSuggested: false });
    expect(offerCandidates.candidates.map((candidate) => candidate.id)).not.toContain(bill.id);
    await saveRecurringLinks({ templateId: offer.id, month: "2026-11", transactionIds: [tithe.id], chargeIds: [] }, db);
    await saveRecurringLinks({ templateId: google.id, month: "2026-11", transactionIds: [], chargeIds: [charge.id] }, db);
    await saveRecurringLinks({ templateId: light.id, month: "2026-11", transactionIds: [], chargeIds: [] }, db);
    await autoLinkRecurringOccurrences(["2026-11"], db);

    const { byTemplate } = await listRecurringOccurrences("2026-11", db);
    expect(byTemplate[offer.id]).toMatchObject({ recordedCents: 25000, entries: [{ source: "manual" }] });
    expect(byTemplate[google.id]).toMatchObject({ entries: [{ kind: "card", id: charge.id, accountName: "Cartão" }] });
    expect(byTemplate[light.id]).toBeUndefined();
    const lightLinks = await db.query.recurringOccurrenceLinks.findMany({ where: eq(recurringOccurrenceLinks.recurringTemplateId, light.id) });
    expect(lightLinks.map((link) => link.kind)).toEqual(["dismissed"]);

    await saveRecurringLinks({ templateId: light.id, month: "2026-11", transactionIds: [bill.id], chargeIds: [] }, db);
    expect((await listRecurringOccurrences("2026-11", db)).byTemplate[light.id].entries[0].source).toBe("manual");

    await deleteCreditCardCharge(charge.id, db);
    expect((await listRecurringOccurrences("2026-11", db)).byTemplate[google.id]).toBeUndefined();
  });

  it("refuses an entry of another type or already paying another rule", async () => {
    const { db, light, offer, bill } = await seedBankLedger();
    await generateRecurringTransactions("2026-11", db);
    await expect(saveRecurringLinks({ templateId: offer.id, month: "2026-11", transactionIds: [bill.id], chargeIds: [] }, db)).rejects.toThrow("não pode ser vinculado");
    await expect(saveRecurringLinks({ templateId: light.id, month: "2026-11", transactionIds: [], chargeIds: [bill.id] }, db)).rejects.toThrow("não pode ser vinculado");
  });

  it("stops counting an entry the bank cancelled and counts a linked payment on the dashboard", async () => {
    const { db, light, bill } = await seedBankLedger();
    await generateRecurringTransactions("2026-11", db);
    expect((await readDashboardBills("2026-11-11", db)).bills.map((row) => row.description)).not.toContain("Energia");
    expect(await listRecordedOccurrenceKeys(db, [light.id], { startMonth: "2026-11", endMonth: "2026-11" })).toEqual(new Set([`${light.id}:2026-11`]));

    await db.update(transactions).set({ status: "cancelled" }).where(eq(transactions.id, bill.id));
    expect(await listRecordedOccurrenceKeys(db, [light.id])).toEqual(new Set());
  });

  it("keeps the occurrences the app generated apart from links", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    expect(await autoLinkRecurringOccurrences(["2026-11"], db)).toEqual([]);
    expect(await listPaidRecurringTemplateIds(db, "2026-11", [])).toEqual(new Set());
    const wallet = await createAccount({ name: "Carteira", type: "checking", initialBalanceCents: 0 }, db);
    const rent = await createCategory({ name: "Aluguel", group: "fixed_expense" }, db);
    const template = await createRecurringTemplate({ accountId: wallet.id, categoryId: rent.id, type: "expense", amountCents: 90000, description: "Aluguel", dayOfMonth: 5, startMonth: "2026-01" }, db);
    const [generated] = await generateRecurringTransactions("2026-11", db);

    expect((await listRecurringOccurrences("2026-11", db)).byTemplate[template.id].entries).toMatchObject([{ id: generated.id, source: "generated", accountName: "Carteira" }]);
    expect(await listRecurringLinkCandidates(template.id, "2026-11", db)).toMatchObject({ generated: [{ id: generated.id, source: "generated" }] });
    expect(await listPaidRecurringTemplateIds(db, "2026-11", [template.id])).toEqual(new Set([template.id]));

    // A month the user cancelled is not recorded on screen, but the projection must not bring it back.
    await db.update(transactions).set({ status: "cancelled" }).where(eq(transactions.id, generated.id));
    expect((await listRecurringOccurrences("2026-11", db)).recordedKeys).toEqual([]);
    expect(await listRecordedOccurrenceKeys(db, [template.id])).toEqual(new Set([`${template.id}:2026-11`]));
  });

  it("offers only single purchases and live ledger entries", async () => {
    const { db, card, cloud, energy, bank } = await seedBankLedger();
    await createCreditCardCharge({ accountId: card.id, categoryId: cloud.id, description: "NOTEBOOK", purchaseDate: "2026-11-12", totalAmountCents: 300000, installmentCount: 3 }, db);
    await createTransaction({ accountId: bank.id, categoryId: energy.id, type: "expense", amountCents: 100, transactionDate: "2026-11-02", competenceMonth: "2026-11", description: "ESTORNADO", status: "cancelled" }, db);
    await createTransaction({ accountId: bank.id, categoryId: energy.id, type: "expense", amountCents: 100, transactionDate: "2026-12-20", competenceMonth: "2026-12", description: "DEPOIS", status: "posted" }, db);
    const descriptions = (await listRecurringMatchCandidates(db, "2026-11")).map((candidate) => candidate.description);
    expect(descriptions).toEqual(["Oferta", "CEMIG"]);
  });
});
