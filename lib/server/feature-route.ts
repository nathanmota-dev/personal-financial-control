import "server-only";
import { z } from "zod";

import { isDemoMode } from "@/lib/demo/mode";
import { databaseErrorResponse } from "@/lib/server/database-error-response";
import { domainErrorResponse } from "@/lib/server/domain-error-response";
import { DomainError } from "@/lib/server/errors";
import { privateRoute, rejectRouteMethod } from "@/lib/server/route-response";

type FeatureErrorCodes = { invalid: string; internal: string };

function failure(code: string, message: string, status: number) {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

const unavailable = () => failure("NOT_FOUND", "Recurso indisponível.", 404);

/**
 * Response helpers for an optional feature that never exists in demo mode. `respond` runs after `apiGuard` in each
 * handler: demo isolation first, then safe error mapping that never echoes internal details.
 */
export function createFeatureRoute(codes: FeatureErrorCodes) {
  function errorResponse(error: unknown) {
    const database = databaseErrorResponse(error);
    if (database) return database;
    if (error instanceof DomainError) return domainErrorResponse(error);
    if (error instanceof z.ZodError || error instanceof SyntaxError) return failure(codes.invalid, "Dados inválidos.", 400);
    return failure(codes.internal, "Não foi possível concluir a operação.", 500);
  }

  async function respond(action: () => Promise<Response>): Promise<Response> {
    if (isDemoMode()) return unavailable();
    try {
      return await action();
    } catch (error) {
      return errorResponse(error);
    }
  }

  const rejectMethod = privateRoute(async (request: Request): Promise<Response> => {
    const response = await rejectRouteMethod(request);
    return response.status === 405 && isDemoMode() ? unavailable() : response;
  });

  return { respond, rejectMethod };
}
