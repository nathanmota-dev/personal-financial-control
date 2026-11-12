"use client";

import { IconTile } from "@/components/finance/ds/icon-tile";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Progress } from "@/components/ui/progress";
import { toneClass, toneForKey } from "@/lib/finance-tone";
import type { BudgetMetricValue, BudgetRowProps } from "@/lib/interfaces/budgets";
import type { Tone } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";
import { BudgetDialog } from "./budget-dialog";
import { BudgetExpenses } from "./budget-expenses";
import { BudgetRemove } from "./budget-remove";

const states = { below: "Abaixo de 80%", warning: "Atenção: de 80% a menos de 100%", reached: "Limite atingido ou ultrapassado" };
const stateTones: Record<keyof typeof states, Tone> = { below: "success", warning: "warning", reached: "danger" };

export function BudgetCategoryRow({ row, month }: BudgetRowProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const values: BudgetMetricValue[] = [["Realizado", formatCurrency(row.postedCents)], ["Pendente", formatCurrency(row.pendingCents)]];
  if (row.limit) values.push(["Saldo do limite", formatCurrency(row.remainingCents!)]);
  else values.push(["Comprometido", formatCurrency(row.committedCents)]);
  const meterTone = row.state ? stateTones[row.state] : "brand";
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-[14px] border border-border bg-card p-4 transition-colors hover:border-content-subtle/40" aria-label={row.categoryName}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconTile tone={toneForKey(row.categoryName)}><Layers /></IconTile>
          <div className="min-w-0">
            <h3 data-user-content className="truncate text-sm font-semibold">{row.categoryName}</h3>
            {row.archived && <p className="text-xs text-content-subtle">Arquivada</p>}
          </div>
        </div>
        {row.limit && (
          <div className="flex shrink-0 gap-1">
            <BudgetDialog month={month} categories={[{ id: row.categoryId!, name: row.categoryName, isArchived: row.archived, group: "expense" }]} limit={row.limit} />
            <BudgetRemove categoryId={row.categoryId!} competenceMonth={month} />
          </div>
        )}
      </div>
      {row.limit ? (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <p className="min-w-0 text-xl leading-7 font-semibold tracking-tight break-words tabular-nums">
              {formatCurrency(row.committedCents)}
              <span className="ml-1.5 text-xs font-medium text-content-muted">de {formatCurrency(row.limit.amountCents)}</span>
            </p>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{hidden ? "—" : `${row.percent!.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}</span>
          </div>
          <Progress
            aria-label={`Consumo de ${row.categoryName}`}
            value={hidden ? 0 : Math.max(0, Math.min(100, row.percent!))}
            className={cn("tone-stripes h-2.5 bg-transparent [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-tone", toneClass(meterTone))}
          />
          {row.state && <ToneChip tone={meterTone} dot>{states[row.state]}</ToneChip>}
        </div>
      ) : null}
      <dl className="grid grid-cols-3 gap-3 text-sm tabular-nums">
        {values.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[11px] text-content-muted">{label}</dt><dd className="mt-0.5 font-semibold break-words">{value}</dd></div>)}
      </dl>
      {row.committedCents < 0 && <p className="text-xs text-success">Crédito líquido: os estornos superam as despesas e aumentam o saldo do limite.</p>}
      <div className="mt-auto border-t border-border pt-3"><BudgetExpenses row={row} /></div>
    </article>
  );
}
