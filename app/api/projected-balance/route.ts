import { apiGuard } from "@/lib/auth/server";
import { domainErrorResponse } from "@/lib/server/domain-error-response";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { DomainError } from "@/lib/server/errors";
import {
getProjectedBalance,
parseProjectedBalanceSearchParams,
} from "@/lib/server/projected-balance";

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
      return domainErrorResponse(error);
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

export const GET = privateRoute(handleGET);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
