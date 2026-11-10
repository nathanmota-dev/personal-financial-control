"use client";

import { HeroPanel } from "@/components/finance/ds/hero-panel";
import { HeroStat } from "@/components/finance/ds/hero-stat";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel, formatRateFromBps } from "@/lib/finance-ui";
import type { InvestmentsViewSection1Props } from "@/lib/interfaces/render/investments-view-investments-view-section1";
import { CalendarClock, Flag, Percent, TrendingUp } from "lucide-react";

export function InvestmentsViewSection1({ projection, cards }: InvestmentsViewSection1Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <HeroPanel
      eyebrow="Saldo estimado hoje"
      value={projection ? formatCurrency(projection.currentBalanceCents) : "R$ 0,00"}
      caption={projection ? `Conferido em ${formatDateLabel(projection.checkpointDate)}` : "Configure o primeiro checkpoint real."}
      aside={
        <div className="flex w-full flex-col gap-2.5 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-xs font-semibold text-white/80">Projeções com seus lançamentos</p>
          {projection ? cards.map((card) => (
            <div key={card.months} className="flex items-center justify-between gap-3 border-t border-white/10 pt-2.5 text-sm first:border-0">
              <span className="text-white/75">{card.months} {card.months === 1 ? "mês" : "meses"}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(card.value ?? 0)}</span>
            </div>
          )) : <p className="text-xs leading-5 text-white/70">Configure a carteira para visualizar as projeções.</p>}
        </div>
      }
    >
      <HeroStat label="Rendimento estimado" value={projection ? formatCurrency(projection.estimatedInterestCents) : "R$ 0,00"} hint={projection ? `Desde ${formatDateLabel(projection.checkpointDate)}` : "Calculado entre checkpoints."} icon={<TrendingUp />} />
      <HeroStat label="Próximo aporte previsto" value={projection?.nextContributionDate ? formatDateLabel(projection.nextContributionDate) : "Nenhum"} hint={projection ? "Pelas recorrências e lançamentos" : "Use uma recorrência para planejar."} icon={<CalendarClock />} />
      <HeroStat label="Taxa esperada" value={projection ? formatRateFromBps(projection.expectedMonthlyRateBps) : "—"} hint="Usada na estimativa diária" icon={<Percent />} />
      <HeroStat label="Saldo de referência" value={projection ? formatCurrency(projection.checkpointBalanceCents) : "—"} hint={projection ? formatDateLabel(projection.checkpointDate) : "Sem conferência"} icon={<Flag />} />
    </HeroPanel>
  );
}
