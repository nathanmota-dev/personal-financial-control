import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { DomainError } from "@/lib/server/errors";

export function creditCardApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof DomainError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_CREDIT_CARD_PAYLOAD",
          message: error.issues[0]?.message ?? "Invalid credit card payload.",
        },
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { ok: false, error: { code: "CREDIT_CARD_API_ERROR", message: fallbackMessage } },
    { status: 500 }
  );
}
