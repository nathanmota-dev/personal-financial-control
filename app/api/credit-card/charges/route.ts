import { NextResponse } from "next/server";

import { creditCardApiError } from "@/app/api/credit-card/_responses";
import {
  createCreditCardCharge,
  listCreditCardCharges,
} from "@/lib/server/credit-card";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const charges = await listCreditCardCharges({
      accountId: params.get("accountId") ?? undefined,
      invoiceMonth: params.get("invoiceMonth") ?? undefined,
    });

    return NextResponse.json({ ok: true, charges });
  } catch (error) {
    return creditCardApiError(error, "Unable to list credit card purchases.");
  }
}

export async function POST(request: Request) {
  try {
    const charge = await createCreditCardCharge(await request.json());
    return NextResponse.json({ ok: true, charge }, { status: 201 });
  } catch (error) {
    return creditCardApiError(error, "Unable to create credit card purchase.");
  }
}
