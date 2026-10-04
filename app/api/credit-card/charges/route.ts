import { apiGuard } from "@/lib/auth/server";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";
import { NextResponse } from "next/server";

import { creditCardApiError } from "@/app/api/credit-card/_responses";
import {
createCreditCardCharge,
listCreditCardCharges,
} from "@/lib/server/credit-card";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
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

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const charge = await createCreditCardCharge(await request.json());
    return NextResponse.json({ ok: true, charge }, { status: 201 });
  } catch (error) {
    return creditCardApiError(error, "Unable to create credit card purchase.");
  }
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
