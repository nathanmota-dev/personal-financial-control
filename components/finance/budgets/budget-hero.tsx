"use client";

import { HeroPanel } from "@/components/finance/ds/hero-panel";
import { HeroStat } from "@/components/finance/ds/hero-stat";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { toPercent } from "@/lib/finance-tone";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { BudgetsViewProps } from "@/lib/interfaces/budgets";
import { CheckCircle2, Clock3, Gauge, Layers } from "lucide-react";

export function BudgetHero({ overview }: BudgetsViewProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const limits = overview.rows.filter((row) => row.limit);
  const planned = limits.reduce((sum, row) => sum + row.limit!.amountCents, 0);
  const used = limits.reduce((sum, row) => sum + row.committedCents, 0);
  const posted = overview.rows.reduce((sum, row) => sum + row.postedCents, 0);
  const pending = overview.rows.reduce((sum, row) => sum + row.pendingCents, 0);
  const remaining = limits.reduce((sum, row) => sum + row.remainingCents!, 0);
  const percent = toPercent(used, planned);
  return (
    <HeroPanel
      eyebrow="Saldo dos limites"
      value={limits.length ? formatCurrency(remaining) : "Sem limites"}
      caption={limits.length ? `Disponível nas categorias com limite em ${formatMonthLabel(overview.month)}.` : `Defina limites para acompanhar o consumo de ${formatMonthLabel(overview.month)}.`}
      aside={
        <div className="flex w-full flex-col justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <div className="flex items-end justify-between gap-3">
            <p className="text-xs font-semibold text-white/80">Consumo dos limites</p>
            <p className="text-2xl leading-none font-semibold tabular-nums">{hidden ? "—" : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`}</p>
          </div>
          <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.28)_0_3px,transparent_3px_7px)]">
            <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: hidden ? 0 : `${percent}%` }} />
          </div>
          <div className="flex justify-between gap-3 text-[11px] text-white/75">
            <span>Usado {formatCurrency(used)}</span>
            <span>de {formatCurrency(planned)}</span>
          </div>
        </div>
      }
    >
      <HeroStat label="Limites do mês" value={formatCurrency(planned)} hint={`${limits.length} categoria(s)`} icon={<Layers />} />
      <HeroStat label="Realizado" value={formatCurrency(posted)} hint="Efetivado no mês" icon={<CheckCircle2 />} />
      <HeroStat label="Pendente" value={formatCurrency(pending)} hint="Ainda não efetivado" icon={<Clock3 />} />
      <HeroStat label="Comprometido" value={formatCurrency(overview.committedCents)} hint="Realizado + pendente" icon={<Gauge />} />
    </HeroPanel>
  );
}
