import "server-only";
import { z } from "zod";

import { isDemoMode } from "@/lib/demo/mode";
import { databaseErrorResponse } from "@/lib/server/database-error-response";
import { domainErrorResponse } from "@/lib/server/domain-error-response";
import { DomainError } from "@/lib/server/errors";
import { privateRoute, rejectRouteMethod } from "@/lib/server/route-response";

function failure(code: string, message: string, status: number) {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

function pluggyErrorResponse(error: unknown) {
  const database = databaseErrorResponse(error);
  if (database) return database;
  if (error instanceof DomainError) return domainErrorResponse(error);
  if (error instanceof z.ZodError || error instanceof SyntaxError) return failure("INVALID_PLUGGY_REQUEST", "Dados inválidos.", 400);
  return failure("PLUGGY_INTERNAL_ERROR", "Não foi possível concluir a operação.", 500);
}

const unavailable = () => failure("NOT_FOUND", "Recurso indisponível.", 404);

/** Runs after `apiGuard` in each handler: demo isolation first, then safe error mapping. */
export async function pluggyResponse(action: () => Promise<Response>): Promise<Response> {
  if (isDemoMode()) return unavailable();
  try {
    return await action();
  } catch (error) {
    return pluggyErrorResponse(error);
  }
}

export const rejectPluggyMethod = privateRoute(async (request: Request): Promise<Response> => {
  const response = await rejectRouteMethod(request);
  return response.status === 405 && isDemoMode() ? unavailable() : response;
});
