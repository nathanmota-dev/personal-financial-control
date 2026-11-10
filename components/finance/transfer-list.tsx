"use client";

import { DateGroupLabel } from "@/components/finance/ds/date-group-label";
import { IconTile } from "@/components/finance/ds/icon-tile";
import { SectionCard } from "@/components/finance/ds/section-card";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { SetupCallout } from "@/components/finance/setup-dialogs";
import { TransferDialog } from "@/components/finance/transaction-actions";
import { groupByDate } from "@/lib/finance-tone";
import type { TransferListProps } from "@/lib/interfaces/transactions";
import { ArrowLeftRight, ArrowRight } from "lucide-react";

export function TransferList({ transfers, accounts, filters }: TransferListProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <SectionCard title="Transferências do mês" count={transfers.length} icon={<ArrowLeftRight />} description="Movimentações entre as suas contas, sem impacto no resultado.">
      {transfers.length ? (
        <div className="space-y-5">
          {groupByDate(transfers, (item) => item.transferDate).map((group) => (
            <div key={group.date} className="space-y-1">
              <div className="border-b border-border px-2 pb-2 md:px-3"><DateGroupLabel date={group.date} /></div>
              {group.rows.map((transfer) => (
                <div key={transfer.id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-muted/50 md:px-3">
                  <IconTile tone="brand"><ArrowLeftRight /></IconTile>
                  <div className="min-w-0 flex-1">
                    <p data-user-content className="truncate text-sm font-medium text-content-strong">{transfer.description}</p>
                    <p className="flex flex-wrap items-center gap-1.5 text-xs text-content-muted">
                      {transfer.fromAccount ? <span data-user-content>{transfer.fromAccount.name}</span> : "-"}
                      <ArrowRight aria-hidden="true" className="size-3" />
                      <span className="sr-only">para</span>
                      {transfer.toAccount ? <span data-user-content>{transfer.toAccount.name}</span> : "-"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap text-brand tabular-nums">{formatCurrency(transfer.amountCents)}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <FinanceEmptyState
          title="Sem transferências"
          description="Transferências exigem pelo menos duas contas cadastradas."
          action={
            accounts.length >= 2 ? (
              <TransferDialog accounts={accounts} month={filters.month} />
            ) : (
              <SetupCallout title="Cadastre duas contas" description="Crie pelo menos duas contas para movimentar saldo entre origem e destino." />
            )
          }
        />
      )}
    </SectionCard>
  );
}
