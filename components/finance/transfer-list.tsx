"use client";

import { DateGroupLabel } from "@/components/finance/ds/date-group-label";
import { IconTile } from "@/components/finance/ds/icon-tile";
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
    <div className="px-[22px] pt-5 pb-4">
      <p className="text-xs text-content-muted">{`${transfers.length} transferência(s) · movimentações entre as suas contas, sem impacto no resultado.`}</p>
      {transfers.length ? (
        <div className="mt-1">
          {groupByDate(transfers, (item) => item.transferDate).map((group) => (
            <div key={group.date}>
              <div className="pt-4 pb-1"><DateGroupLabel date={group.date} /></div>
              {group.rows.map((transfer) => (
                <div key={transfer.id} className="flex items-center gap-3 border-t border-border/80 py-3.5 transition-colors">
                  <IconTile tone="brand"><ArrowLeftRight /></IconTile>
                  <div className="min-w-0 flex-1">
                    <p data-user-content className="truncate text-[13px] font-semibold text-content-strong">{transfer.description}</p>
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
    </div>
  );
}
