import { NextResponse } from "next/server";

import { creditCardApiError } from "@/app/api/credit-card/_responses";
import {
  deleteCreditCardCharge,
  getCreditCardCharge,
  updateCreditCardCharge,
} from "@/lib/server/credit-card";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return NextResponse.json({ ok: true, charge: await getCreditCardCharge(id) });
  } catch (error) {
    return creditCardApiError(error, "Unable to load credit card purchase.");
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const charge = await updateCreditCardCharge({ ...(await request.json()), id });
    return NextResponse.json({ ok: true, charge });
  } catch (error) {
    return creditCardApiError(error, "Unable to update credit card purchase.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await deleteCreditCardCharge(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return creditCardApiError(error, "Unable to delete credit card purchase.");
  }
}
