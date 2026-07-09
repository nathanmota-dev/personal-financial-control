import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { DomainError } from "@/lib/server/errors";

export function revalidateGoalViews() {
  [
    "/",
    "/dashboard",
    "/transactions",
    "/projected-balance",
    "/investments",
    "/goals",
  ].forEach((path) => {
    revalidatePath(path);
  });
}

export function okJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    init
  );
}

export function noStoreJson(data: unknown) {
  return okJson(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function goalApiError(
  error: unknown,
  fallback: {
    code: string;
    message: string;
    invalidCode: string;
    invalidMessage: string;
  }
) {
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
          code: fallback.invalidCode,
          message: fallback.invalidMessage,
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
        code: fallback.code,
        message:
          error instanceof Error && error.message ? error.message : fallback.message,
      },
    },
    { status: 500 }
  );
}
