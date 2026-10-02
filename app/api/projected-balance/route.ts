import { apiGuard } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  getProjectedBalance,
  parseProjectedBalanceSearchParams,
} from "@/lib/server/projected-balance";
import { DomainError } from "@/lib/server/errors";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
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

export async function GET(...args: Parameters<typeof handleGET>) {
  const response = await handleGET(...args);
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
