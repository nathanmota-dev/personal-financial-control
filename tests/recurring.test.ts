import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import {
  createRecurringTemplate,
  deleteRecurringTemplate,
  generateRecurringTransactions,
  updateRecurringTemplate,
} from "@/lib/server/recurring";
import { listCategories } from "@/lib/server/categories";
import { createTransaction, listTransactions } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("recurring", () => {
  it("uses the recurrence name and replaces an incompatible category with the default", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const rent = await createCategory({ name: "Rent", group: "fixed_expense" }, db);
    const salary = (await listCategories({}, db)).find((category) => category.name === "Salário");

    const template = await createRecurringTemplate(
      {
        accountId: account.id,
        categoryId: rent.id,
        type: "expense",
        amountCents: 50000,
        dayOfMonth: 5,
        startMonth: "2026-05",
        endMonth: "2026-12",
        name: "Monthly payment",
      },
      db
    );

    const updated = await updateRecurringTemplate(
      {
        id: template.id,
        type: "income",
        categoryId: rent.id,
        name: "Monthly salary",
        endMonth: null,
      },
      db
    );

    expect(template.description).toBe("Monthly payment");
    expect(updated.description).toBe("Monthly salary");
    expect(updated.categoryId).toBe(salary?.id);
    expect(updated.endMonth).toBeNull();
  });

  it("deletes a rule while keeping and unlinking its generated history", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const category = await createCategory({ name: "Rent", group: "fixed_expense" }, db);
    const template = await createRecurringTemplate(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 50000,
        dayOfMonth: 5,
        startMonth: "2026-05",
        description: "Monthly rent",
      },
      db
    );
    const [generated] = await generateRecurringTransactions("2026-05", db);
    const manual = await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 50000,
        transactionDate: "2026-05-05",
        competenceMonth: "2026-05",
        description: "Monthly rent",
      },
      db
    );

    await deleteRecurringTemplate(template.id, "keep_history", db);

    const rows = await listTransactions({}, db);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === generated?.id)?.recurringTemplateId).toBeNull();
    expect(rows.find((row) => row.id === manual.id)?.recurringTemplateId).toBeNull();
  });

  it("deletes only transactions linked to the rule when history is removed", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const category = await createCategory({ name: "Rent", group: "fixed_expense" }, db);
    const template = await createRecurringTemplate(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 50000,
        dayOfMonth: 5,
        startMonth: "2026-05",
        description: "Monthly rent",
      },
      db
    );
    const [generated] = await generateRecurringTransactions("2026-05", db);
    const manual = await createTransaction(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 50000,
        transactionDate: "2026-05-05",
        competenceMonth: "2026-05",
        description: "Monthly rent",
      },
      db
    );

    await deleteRecurringTemplate(template.id, "delete_history", db);

    const rows = await listTransactions({}, db);
    expect(rows.map((row) => row.id)).toEqual([manual.id]);
    expect(rows.map((row) => row.id)).not.toContain(generated?.id);
  });

  it("generates monthly transactions without duplicating existing occurrences", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const category = await createCategory({ name: "Rent", group: "fixed_expense" }, db);

    await createRecurringTemplate(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 50000,
        dayOfMonth: 5,
        startMonth: "2026-05",
        description: "Monthly rent",
      },
      db
    );

    const created = await generateRecurringTransactions("2026-05", db);

    expect(created).toHaveLength(1);
    expect((await listTransactions({ competenceMonth: "2026-05" }, db)).length).toBe(1);
    await expect(generateRecurringTransactions("2026-05", db)).resolves.toHaveLength(0);
    expect((await listTransactions({ competenceMonth: "2026-05" }, db)).length).toBe(1);
  });

  it("keeps generating missing templates when the month has partial occurrences", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const rent = await createCategory({ name: "Rent", group: "fixed_expense" }, db);
    const utilities = await createCategory({ name: "Utilities", group: "fixed_expense" }, db);

    await createRecurringTemplate(
      {
        accountId: account.id,
        categoryId: rent.id,
        type: "expense",
        amountCents: 50000,
        dayOfMonth: 5,
        startMonth: "2026-05",
        description: "Monthly rent",
      },
      db
    );

    await generateRecurringTransactions("2026-05", db);

    await createRecurringTemplate(
      {
        accountId: account.id,
        categoryId: utilities.id,
        type: "expense",
        amountCents: 12000,
        dayOfMonth: 8,
        startMonth: "2026-05",
        description: "Utilities",
      },
      db
    );

    const created = await generateRecurringTransactions("2026-05", db);
    const transactions = await listTransactions({ competenceMonth: "2026-05" }, db);

    expect(created).toHaveLength(1);
    expect(created[0]?.description).toBe("Utilities");
    expect(transactions.map((transaction) => transaction.description).sort()).toEqual([
      "Monthly rent",
      "Utilities",
    ]);
  });

  it("accepts day 31 and clamps it to the last day of shorter months", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const account = await createAccount(
      { name: "Main", type: "checking", initialBalanceCents: 0 },
      db
    );
    const category = await createCategory({ name: "Rent", group: "fixed_expense" }, db);

    await createRecurringTemplate(
      {
        accountId: account.id,
        categoryId: category.id,
        type: "expense",
        amountCents: 50000,
        dayOfMonth: 31,
        startMonth: "2026-04",
        description: "Monthly rent",
      },
      db
    );

    const created = await generateRecurringTransactions("2026-04", db);

    expect(created[0]?.transactionDate).toBe("2026-04-30");
  });
});
