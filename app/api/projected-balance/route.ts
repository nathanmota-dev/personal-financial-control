import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  getProjectedBalance,
  parseProjectedBalanceSearchParams,
} from "@/lib/server/projected-balance";
import { DomainError } from "@/lib/server/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = parseProjectedBalanceSearchParams(searchParams);
    const projection = await getProjectedBalance(filters);

    return NextResponse.json(projection, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_QUERY",
            message: "Invalid projected balance query parameters.",
            issues: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROJECTED_BALANCE_ERROR",
          message: error instanceof Error ? error.message : "Unknown projected balance error.",
        },
      },
      { status: 500 }
    );
  }
}
