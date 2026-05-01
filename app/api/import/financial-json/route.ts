import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDatabase } from "@/lib/db";
import { accounts, categories, transactions } from "@/lib/db/schema";
import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createTransaction } from "@/lib/server/transactions";
import { parseMoneyToCents } from "@/lib/server/finance";

const moneyItemSchema = z.object({
  name: z.string().trim().min(1),
  value: z.number().finite().nonnegative(),
});

const importPayloadSchema = z.object({
  Entradas: z.array(moneyItemSchema).default([]),
  "Gastos fixos": z.array(moneyItemSchema).default([]),
  "Gastos variáveis": z.array(moneyItemSchema).default([]),
  Investimentos: z.array(moneyItemSchema).default([]),
  context: z
    .object({
      accountName: z.string().trim().min(1).default("Conta principal"),
      accountType: z
        .enum(["checking", "savings", "cash", "credit", "investment"])
        .default("checking"),
      competenceMonth: z.string().default("2026-05"),
      transactionDate: z.string().default("2026-05-01"),
      status: z.enum(["pending", "posted", "cancelled"]).default("posted"),
    })
    .default({
      accountName: "Conta principal",
      accountType: "checking",
      competenceMonth: "2026-05",
      transactionDate: "2026-05-01",
      status: "posted",
    }),
});

type ImportRow = {
  section: "Entradas" | "Gastos fixos" | "Gastos variáveis" | "Investimentos";
  categoryGroup: "income" | "fixed_expense" | "variable_expense" | "investment";
  transactionType: "income" | "expense" | "investment_contribution";
  item: {
    name: string;
    value: number;
  };
};

function flattenPayload(payload: z.infer<typeof importPayloadSchema>): ImportRow[] {
  return [
    ...payload.Entradas.map((item) => ({
      section: "Entradas" as const,
      categoryGroup: "income" as const,
      transactionType: "income" as const,
      item,
    })),
    ...payload["Gastos fixos"].map((item) => ({
      section: "Gastos fixos" as const,
      categoryGroup: "fixed_expense" as const,
      transactionType: "expense" as const,
      item,
    })),
    ...payload["Gastos variáveis"].map((item) => ({
      section: "Gastos variáveis" as const,
      categoryGroup: "variable_expense" as const,
      transactionType: "expense" as const,
      item,
    })),
    ...payload.Investimentos.map((item) => ({
      section: "Investimentos" as const,
      categoryGroup: "investment" as const,
      transactionType: "investment_contribution" as const,
      item,
    })),
  ];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = importPayloadSchema.parse(body);
    const db = getDatabase();

    let account = await db.query.accounts.findFirst({
      where: eq(accounts.name, payload.context.accountName),
    });

    if (!account) {
      account = await createAccount(
        {
          name: payload.context.accountName,
          type: payload.context.accountType,
          initialBalanceCents: 0,
        },
        db
      );
    }

    const rows = flattenPayload(payload);
    const createdCategories: string[] = [];
    const reusedCategories: string[] = [];
    const createdTransactions: Array<{
      id: string;
      section: string;
      name: string;
      amountCents: number;
      type: string;
    }> = [];
    const skippedTransactions: Array<{
      section: string;
      name: string;
      reason: string;
    }> = [];

    for (const row of rows) {
      let category = await db.query.categories.findFirst({
        where: eq(categories.name, row.item.name),
      });

      if (!category) {
        category = await createCategory(
          {
            name: row.item.name,
            group: row.categoryGroup,
          },
          db
        );
        createdCategories.push(category.name);
      } else {
        reusedCategories.push(category.name);
      }

      const amountCents = parseMoneyToCents(row.item.value);

      const duplicate = await db.query.transactions.findFirst({
        where: and(
          eq(transactions.accountId, account.id),
          eq(transactions.categoryId, category.id),
          eq(transactions.type, row.transactionType),
          eq(transactions.amountCents, amountCents),
          eq(transactions.transactionDate, payload.context.transactionDate),
          eq(transactions.competenceMonth, payload.context.competenceMonth),
          eq(transactions.description, row.item.name)
        ),
      });

      if (duplicate) {
        skippedTransactions.push({
          section: row.section,
          name: row.item.name,
          reason: "duplicate_exact_match",
        });
        continue;
      }

      const transaction = await createTransaction(
        {
          accountId: account.id,
          categoryId: category.id,
          type: row.transactionType,
          status: payload.context.status,
          amountCents,
          transactionDate: payload.context.transactionDate,
          competenceMonth: payload.context.competenceMonth,
          description: row.item.name,
          notes: `Imported from grouped JSON (${row.section})`,
        },
        db
      );

      createdTransactions.push({
        id: transaction.id,
        section: row.section,
        name: row.item.name,
        amountCents,
        type: row.transactionType,
      });
    }

    return NextResponse.json({
      ok: true,
      account: {
        id: account.id,
        name: account.name,
        type: account.type,
      },
      context: payload.context,
      summary: {
        categoriesCreated: createdCategories.length,
        categoriesReused: reusedCategories.length,
        transactionsCreated: createdTransactions.length,
        transactionsSkipped: skippedTransactions.length,
      },
      createdCategories,
      createdTransactions,
      skippedTransactions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown import error",
      },
      { status: 400 }
    );
  }
}
