"use client";

import { HeroPanel } from "@/components/finance/ds/hero-panel";
import { HeroStat } from "@/components/finance/ds/hero-stat";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { toPercent } from "@/lib/finance-tone";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { RecurringHeroProps, RecurringTemplateRow } from "@/lib/interfaces/recurring";
import { ArrowUpRight, PauseCircle, TrendingDown, TrendingUp } from "lucide-react";

function isScheduled(template: RecurringTemplateRow, month: string) {
  return template.status === "active" && template.startMonth <= month && (!template.endMonth || template.endMonth >= month);
}

export function RecurringHero({ month, templates }: RecurringHeroProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const scheduled = templates.filter((template) => isScheduled(template, month));
  const sum = (type: RecurringTemplateRow["type"]) => scheduled.filter((item) => item.type === type).reduce((total, item) => total + item.amountCents, 0);
  const expenses = sum("expense");
  const generated = scheduled.filter((item) => item.type === "expense" && item.lastGeneratedMonth === month).reduce((total, item) => total + item.amountCents, 0);
  const percent = toPercent(generated, expenses);
  const paused = templates.filter((template) => template.status === "paused").length;
  return (
    <HeroPanel
      eyebrow="Compromissos fixos do mês"
      value={formatCurrency(expenses)}
      caption={`Despesas recorrentes ativas previstas para ${formatMonthLabel(month)}.`}
      aside={
        <div className="flex w-full flex-col justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <div className="flex items-end justify-between gap-3">
            <p className="text-xs font-semibold text-white/80">Já lançado no mês</p>
            <p className="text-2xl leading-none font-semibold tabular-nums">{hidden ? "—" : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`}</p>
          </div>
          <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.28)_0_3px,transparent_3px_7px)]">
            <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: hidden ? 0 : `${percent}%` }} />
          </div>
          <div className="flex justify-between gap-3 text-[11px] text-white/75">
            <span>Lançado {formatCurrency(generated)}</span>
            <span>A lançar {formatCurrency(expenses - generated)}</span>
          </div>
        </div>
      }
    >
      <HeroStat label="Despesas fixas" value={formatCurrency(expenses)} icon={<TrendingDown />} />
      <HeroStat label="Receitas fixas" value={formatCurrency(sum("income"))} icon={<TrendingUp />} />
      <HeroStat label="Aportes programados" value={formatCurrency(sum("investment_contribution"))} icon={<ArrowUpRight />} />
      <HeroStat label="Regras pausadas" value={String(paused)} hint={`${scheduled.length} ativa(s) no mês`} icon={<PauseCircle />} />
    </HeroPanel>
  );
}
