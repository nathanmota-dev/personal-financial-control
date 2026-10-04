import type { DomainError } from "@/lib/server/errors";
import { NextResponse } from "next/server";

export function domainErrorResponse(error: DomainError) {
  return NextResponse.json({
    ok: false,
    error: { code: error.code, message: error.message },
  }, { status: error.status });
}
