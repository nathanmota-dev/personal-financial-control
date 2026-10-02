import { apiGuard } from "@/lib/auth/server";
import { NextResponse } from "next/server";

import { createAccount, listAccounts } from "@/lib/server/accounts";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, accounts: await listAccounts() });
}

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const account = await createAccount(await request.json());
    return NextResponse.json({ ok: true, account }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Account creation failed" },
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
