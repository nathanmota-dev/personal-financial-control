import { apiGuard } from "@/lib/auth/server";
import { flattenPayload,importPayloadSchema } from "@/lib/server/financial-json";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";
import { importFinancialRows } from "@/lib/server/stages/import-financial-rows";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getFinanceDatabase } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { createAccount } from "@/lib/server/accounts";

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const payload = importPayloadSchema.parse(body);
    const db = await getFinanceDatabase();

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

    const { createdCategories, reusedCategories, createdTransactions, skippedTransactions } = await importFinancialRows({ flattenPayload, payload, db, account });

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

export const POST = privateRoute(handlePOST);

export const HEAD = rejectRouteMethod;

export const OPTIONS = rejectRouteMethod;