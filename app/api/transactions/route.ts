import { NextResponse } from "next/server";

import { createTransaction, listTransactions } from "@/lib/server/transactions";

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("competenceMonth") ?? undefined;
  return NextResponse.json({ ok: true, transactions: await listTransactions({ competenceMonth: month }) });
}

export async function POST(request: Request) {
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
