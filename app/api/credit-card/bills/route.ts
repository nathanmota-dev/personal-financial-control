import { NextResponse } from "next/server";

import { creditCardApiError } from "@/app/api/credit-card/_responses";
import {
  listCreditCardBills,
  upsertCreditCardBill,
} from "@/lib/server/credit-card-bills";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const bills = await listCreditCardBills({
      accountId: params.get("accountId") ?? undefined,
      invoiceMonth: params.get("invoiceMonth") ?? undefined,
    });

    return NextResponse.json({ ok: true, bills });
  } catch (error) {
    return creditCardApiError(error, "Unable to list credit card bills.");
  }
}

export async function POST(request: Request) {
  try {
    const bill = await upsertCreditCardBill(await request.json());
    return NextResponse.json({ ok: true, bill }, { status: 201 });
  } catch (error) {
    return creditCardApiError(error, "Unable to save credit card bill.");
  }
}
