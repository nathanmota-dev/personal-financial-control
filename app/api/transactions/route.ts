import { apiGuard } from "@/lib/auth/server";
import { NextResponse } from "next/server";

import { createTransaction, listTransactions } from "@/lib/server/transactions";

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

export async function GET(...args: Parameters<typeof handleGET>) {
  const response = await handleGET(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(...args: Parameters<typeof handlePOST>) {
  const response = await handlePOST(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function HEAD(request: Request) {
  const denied = await apiGuard(request);
  return denied ?? new Response(null, { status: 405, headers: { "Cache-Control": "private, no-store" } });
}
export async function OPTIONS(request: Request) {
  const denied = await apiGuard(request);
  return denied ?? new Response(null, { status: 405, headers: { "Cache-Control": "private, no-store" } });
}
