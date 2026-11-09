"use client";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { OpenFinanceItemCard } from "@/components/finance/open-finance/open-finance-item-card";
import { OpenFinanceItemForm } from "@/components/finance/open-finance/open-finance-item-form";
import { OpenFinanceSyncPanel } from "@/components/finance/open-finance/open-finance-sync-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOpenFinance } from "@/hooks/use-open-finance";
import type { OpenFinanceWorkspaceProps } from "@/lib/interfaces/components/open-finance";
import { buildPluggyAccountRows } from "@/lib/pluggy-ui";

export function OpenFinanceWorkspace({ accounts }: OpenFinanceWorkspaceProps) {
  const { overview, run, loading, busy, syncing, error, addItem, removeItem, saveLink, sync } = useOpenFinance();
  const items = overview?.items ?? [];
  return (
    <div className="space-y-4">
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <OpenFinanceSyncPanel run={run} syncing={syncing} onSync={sync} />
        <OpenFinanceItemForm busy={busy} onAdd={addItem} />
      </div>
      {loading ? <p role="status" className="text-sm text-content-muted">Carregando conexões…</p> : null}
      {!loading && !items.length ? (
        <FinanceEmptyState title="Nenhum banco conectado" description="Adicione o Item ID de uma conexão do MeuPluggy para listar as contas do banco." />
      ) : null}
      {items.map((item) => (
        <OpenFinanceItemCard
          key={item.id}
          item={item}
          rows={buildPluggyAccountRows(item, overview?.links ?? [])}
          accounts={accounts}
          busy={busy}
          onRemove={removeItem}
          onSaveLink={saveLink}
        />
      ))}
    </div>
  );
}
