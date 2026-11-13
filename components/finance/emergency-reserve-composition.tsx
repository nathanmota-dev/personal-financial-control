"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { ReserveFigure } from "@/components/finance/reserve-figure";
import { formatDateLabel } from "@/lib/finance-ui";
import type { EmergencyReserveCompositionProps } from "@/lib/interfaces/investment-reserve";

export function EmergencyReserveComposition({ composition }: EmergencyReserveCompositionProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <section className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/reports-clipboard.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Composição líquida da reserva</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Estes ativos explicam o saldo oficial; não são somados novamente ao patrimônio</p>
      <dl className="mt-5 grid gap-x-6 gap-y-4 border-b border-border pb-5 sm:grid-cols-3">
        <ReserveFigure label="Saldo oficial" value={composition.officialBalanceCents} />
        <ReserveFigure label="Composição cadastrada" value={composition.registeredCents} />
        <ReserveFigure label="Diferença de conciliação" value={composition.differenceCents} />
      </dl>
      {composition.holdings.length ? (
        <ul className="divide-y divide-border">
          {composition.holdings.map((holding) => (
            <li key={holding.id} className="flex items-center justify-between gap-4 py-3.5 text-[13px]">
              <div className="min-w-0">
                <p data-user-content className="truncate font-semibold text-content-strong">{holding.name}</p>
                <p className="text-xs text-content-muted">{holding.institutionName ? <span data-user-content>{holding.institutionName}</span> : "Instituição não informada"} · {formatDateLabel(holding.valueAsOf)}</p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums text-content-strong">{formatCurrency(holding.amountCents)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pt-6 text-center text-sm text-content-muted">Nenhum ativo líquido foi dedicado integralmente à reserva.</p>
      )}
    </section>
  );
}
