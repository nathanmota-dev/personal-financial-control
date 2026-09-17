import { NextResponse } from "next/server";

import { creditCardApiError } from "@/app/api/credit-card/_responses";
import { createCreditCardBillPayment } from "@/lib/server/credit-card-bills";

type RouteContext = {
  params: Promise<{ invoiceMonth: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
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
