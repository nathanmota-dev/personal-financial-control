import { apiGuard } from "@/lib/auth/server";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";
import { NextResponse } from "next/server";

import { createAccount,listAccounts } from "@/lib/server/accounts";

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

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
