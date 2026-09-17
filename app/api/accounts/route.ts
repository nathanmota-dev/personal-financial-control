import { NextResponse } from "next/server";

import { createAccount, listAccounts } from "@/lib/server/accounts";

export async function GET() {
  return NextResponse.json({ ok: true, accounts: await listAccounts() });
}

export async function POST(request: Request) {
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
