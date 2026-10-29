import { DomainError } from "@/lib/server/errors";

export function databaseUnavailable(uncertain = false) {
  return new DomainError(
    uncertain ? "DATABASE_WRITE_UNCONFIRMED" : "DATABASE_UNAVAILABLE",
    uncertain
      ? "Não foi possível confirmar a gravação. Sincronize e confira os dados antes de repetir."
      : "Sincronização indisponível. Você pode consultar os dados locais; reconecte para salvar alterações.",
    503,
  );
}

export function replicaError(error: unknown): DomainError | undefined {
  let current = error;
  for (let depth = 0; depth < 8 && current instanceof Error; depth++) {
    if (current instanceof DomainError && current.code.startsWith("DATABASE_")) return current;
    current = current.cause;
  }
}

export function isConnectionFailure(error: unknown): boolean {
  return error instanceof Error && /network|fetch failed|transport|connection|socket|timed? ?out|timeout|dns|http|hrana|stream.*closed|unauthorized|forbidden|ECONN|ENOTFOUND|EHOST|ENET/i.test(error.message);
}
