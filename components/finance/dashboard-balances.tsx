"use client";

import type { DashboardBalancesProps } from "@/lib/interfaces/dashboard";
import { accountTypeLabels } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";

export function DashboardBalances({ accounts }: DashboardBalancesProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
        <section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 xl:h-[238px]">
          <h2 className="text-lg font-semibold">Saldos por conta</h2>
          <p className="mt-1 text-xs text-content-muted">
            Posição atual das contas
          </p>
          <div className="mt-[23px] max-h-[144px] space-y-[13px] overflow-y-auto pr-1">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-3">
                <span className="size-[9px] shrink-0 rounded-full bg-chart-3" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">
                    {account.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-content-subtle">
                    {accountTypeLabels[account.type]} · {account.metricLabel}
                  </p>
                </div>
                <p
                  title={account.metricLabel}
                  className="text-[13px] font-semibold"
                >
                  {formatCurrency(account.currentBalanceCents)}
                </p>
              </div>
            ))}
            {!accounts.length && (
              <p className="text-sm text-content-muted">
                Nenhuma conta cadastrada.
              </p>
            )}
          </div>
        </section>
  );
}
