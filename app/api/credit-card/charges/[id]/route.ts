import { apiGuard } from "@/lib/auth/server";
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

async function handleGET(_request: Request, { params }: RouteContext) {
  const denied = await apiGuard(_request);
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json({ ok: true, charge: await getCreditCardCharge(id) });
  } catch (error) {
    return creditCardApiError(error, "Unable to load credit card purchase.");
  }
}

async function handlePATCH(request: Request, { params }: RouteContext) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const charge = await updateCreditCardCharge({ ...(await request.json()), id });
    return NextResponse.json({ ok: true, charge });
  } catch (error) {
    return creditCardApiError(error, "Unable to update credit card purchase.");
  }
}

async function handleDELETE(_request: Request, { params }: RouteContext) {
  const denied = await apiGuard(_request);
  if (denied) return denied;
  try {
    const { id } = await params;
    await deleteCreditCardCharge(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return creditCardApiError(error, "Unable to delete credit card purchase.");
  }
}

export async function GET(...args: Parameters<typeof handleGET>) {
  const response = await handleGET(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function PATCH(...args: Parameters<typeof handlePATCH>) {
  const response = await handlePATCH(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function DELETE(...args: Parameters<typeof handleDELETE>) {
  const response = await handleDELETE(...args);
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
