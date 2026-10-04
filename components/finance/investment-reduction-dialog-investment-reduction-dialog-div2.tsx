"use client";

import { InvestmentReductionDialogSection1 } from "@/components/finance/investment-reduction-dialog-investment-reduction-dialog-section1";
import { formatCurrency } from "@/lib/finance-ui";
import type { InvestmentReductionDialogDiv2Props } from "@/lib/interfaces/render/investment-reduction-dialog-investment-reduction-dialog-div2";
import { cn } from "@/lib/utils";
import { CircleDollarSign,ShieldAlert } from "lucide-react";

export function InvestmentReductionDialogDiv2({ amountCents, selectedCents, groupedSources, amounts, changeAmount, isClosed, remainingCents, footerNote }: InvestmentReductionDialogDiv2Props) {
  return (
<div className="grid min-h-0 gap-4 overflow-y-auto pr-1">
          <div className="grid gap-3 rounded-xl border border-brand/15 bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-[0.68rem] font-semibold text-brand/70">
                Redução a distribuir
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-brand">
                {formatCurrency(amountCents)}
              </p>
            </div>
            <div className="rounded-xl border border-input/80 bg-muted/30 px-3 py-2 text-right">
              <p className="text-xs text-content">Selecionado</p>
              <p className="mt-1 font-semibold text-content-strong">{formatCurrency(selectedCents)}</p>
            </div>
          </div>

          {groupedSources.length ? (
            groupedSources.map((group) => (
              <InvestmentReductionDialogSection1 key={group.label} group={group} amounts={amounts} changeAmount={changeAmount} />
            ))
          ) : (
            <div className="rounded-2xl border border-warning/20 bg-warning/[0.07] p-4 text-sm leading-6 text-warning">
              Não há uma fonte cadastrada para esta redução. Atualize o patrimônio ou escolha o
              patrimônio não cadastrado quando essa opção estiver disponível.
            </div>
          )}

          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
              isClosed
                ? "border-warning/20 bg-warning/[0.06] text-warning"
                : remainingCents > 0
                  ? "border-warning/20 bg-warning/[0.06] text-warning"
                  : "border-danger/20 bg-danger/[0.06] text-danger"
            )}
          >
            {isClosed ? (
              <CircleDollarSign className="mt-0.5 size-4 shrink-0 text-warning" />
            ) : (
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            )}
            <div>
              <p className="font-medium">
                {isClosed
                  ? "A distribuição fecha exatamente a redução."
                  : remainingCents > 0
                    ? `Ainda faltam ${formatCurrency(remainingCents)}.`
                    : `A distribuição excede em ${formatCurrency(Math.abs(remainingCents))}.`}
              </p>
              {footerNote ? <div className="mt-1 text-xs opacity-75">{footerNote}</div> : null}
            </div>
          </div>
        </div>
  );
}
