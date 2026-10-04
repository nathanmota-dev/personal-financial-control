import { apiGuard } from "@/lib/auth/server";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";
import { NextResponse } from "next/server";

import { createTransaction,listTransactions } from "@/lib/server/transactions";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  const month = new URL(request.url).searchParams.get("competenceMonth") ?? undefined;
  return NextResponse.json({ ok: true, transactions: await listTransactions({ competenceMonth: month }) });
}

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const transaction = await createTransaction(await request.json());
    return NextResponse.json({ ok: true, transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Transaction creation failed" },
      { status: 400 }
    );
  }
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
