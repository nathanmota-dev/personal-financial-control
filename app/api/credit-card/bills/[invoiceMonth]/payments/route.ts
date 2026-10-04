import { apiGuard } from "@/lib/auth/server";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";
import { NextResponse } from "next/server";

import { creditCardApiError } from "@/app/api/credit-card/_responses";
import { createCreditCardBillPayment } from "@/lib/server/credit-card-bills";

type RouteContext = {
  params: Promise<{ invoiceMonth: string }>;
};

async function handlePOST(request: Request, { params }: RouteContext) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const { invoiceMonth } = await params;
    const payment = await createCreditCardBillPayment({
      ...(await request.json()),
      invoiceMonth,
    });

    return NextResponse.json({ ok: true, payment }, { status: payment.idempotent ? 200 : 201 });
  } catch (error) {
    return creditCardApiError(error, "Unable to register credit card payment.");
  }
}

export const POST = privateRoute(handlePOST);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
