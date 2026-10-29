"use client";
import { Button } from "@/components/ui/button";
import { useDatabaseSync } from "@/lib/database-sync-context";

export function DatabaseSyncIndicator() {
  const { status, synchronize } = useDatabaseSync();
  if (status?.mode !== "replica") return null;
  const syncing = status.state === "syncing";
  return (
    <aside className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs text-content-muted" aria-label="Sincronização do banco">
      <div role="status" aria-live="polite">
        <span>{syncing ? "Sincronizando dados…" : status.state === "unavailable" ? "Sincronização indisponível · somente consulta" : "Dados sincronizados"}</span>
        {status.lastSuccessfulSyncAt && <time className="ml-2" dateTime={status.lastSuccessfulSyncAt}>Última atualização: {new Date(status.lastSuccessfulSyncAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time>}
      </div>
      <Button variant="ghost" size="sm" disabled={syncing} onClick={() => { void synchronize(); }}>Sincronizar agora</Button>
    </aside>
  );
}
