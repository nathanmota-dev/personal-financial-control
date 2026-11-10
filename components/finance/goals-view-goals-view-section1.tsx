"use client";

import { HeroPanel } from "@/components/finance/ds/hero-panel";
import { HeroStat } from "@/components/finance/ds/hero-stat";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { toPercent } from "@/lib/finance-tone";
import type { GoalsViewSection1Props } from "@/lib/interfaces/render/goals-view-goals-view-section1";
import { CalendarClock, Flag, PiggyBank, ShieldCheck } from "lucide-react";

export function GoalsViewSection1({ dashboard }: GoalsViewSection1Props) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const { summary } = dashboard;
  const percent = toPercent(summary.totalAllocatedCents, summary.totalAllocatedCents + summary.remainingToGoalsCents);
  return (
    <HeroPanel
      eyebrow="Alocado em metas"
      value={formatCurrency(summary.totalAllocatedCents)}
      caption="Parte da carteira que já está reservada para objetivos futuros."
      aside={
        <div className="flex w-full flex-col justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <div className="flex items-end justify-between gap-3">
            <p className="text-xs font-semibold text-white/80">Progresso geral das metas</p>
            <p className="text-2xl leading-none font-semibold tabular-nums">{hidden ? "—" : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`}</p>
          </div>
          <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.28)_0_3px,transparent_3px_7px)]">
            <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: hidden ? 0 : `${percent}%` }} />
          </div>
          <p className="text-[11px] text-white/75">Alocado sobre o total necessário para concluir as metas atuais.</p>
        </div>
      }
    >
      <HeroStat label="Investido total" value={formatCurrency(summary.investmentBalanceCents)} icon={<PiggyBank />} />
      <HeroStat label="Reserva livre" value={formatCurrency(summary.freeReserveCents)} icon={<ShieldCheck />} />
      <HeroStat label="Falta para metas" value={formatCurrency(summary.remainingToGoalsCents)} icon={<Flag />} />
      <HeroStat label="Aporte mensal necessário" value={formatCurrency(summary.monthlyRequiredCents)} icon={<CalendarClock />} />
    </HeroPanel>
  );
}
