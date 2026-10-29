import { replicaError } from "@/lib/db/replica-errors";

export function databaseErrorResponse(error: unknown) {
  const failure = replicaError(error);
  return failure ? Response.json({ ok: false, error: { code: failure.code, message: failure.message } }, {
    status: failure.status, headers: { "Cache-Control": "private, no-store" },
  }) : undefined;
}
