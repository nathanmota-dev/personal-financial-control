import { apiGuard } from "@/lib/auth/server";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";
import { NextResponse } from "next/server";

import { creditCardApiError } from "@/app/api/credit-card/_responses";
import {
listCreditCardBills,
upsertCreditCardBill,
} from "@/lib/server/credit-card-bills";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
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

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const bill = await upsertCreditCardBill(await request.json());
    return NextResponse.json({ ok: true, bill }, { status: 201 });
  } catch (error) {
    return creditCardApiError(error, "Unable to save credit card bill.");
  }
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
