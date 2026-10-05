import { Layers } from "lucide-react";
import { financeIconClassName } from "@/components/finance/finance-styles";
import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/finance-ui";
import type { BudgetRowProps } from "@/lib/interfaces/budgets";
import { BudgetDialog } from "./budget-dialog";
import { BudgetExpenses } from "./budget-expenses";
import { BudgetRemove } from "./budget-remove";

const states = { below: "Abaixo de 80%", warning: "Atenção: de 80% a menos de 100%", reached: "Limite atingido ou ultrapassado" };
const tones = { below: "text-success", warning: "text-warning", reached: "text-danger" };
const progressTones = { below: "[&_[data-slot=progress-indicator]]:bg-brand", warning: "[&_[data-slot=progress-indicator]]:bg-warning", reached: "[&_[data-slot=progress-indicator]]:bg-danger" };

export function BudgetCategoryRow({ row, month }: BudgetRowProps) {
  const values = [["Realizado", formatCurrency(row.postedCents)], ["Pendente", formatCurrency(row.pendingCents)], ["Comprometido", formatCurrency(row.committedCents)]];
  if (row.limit) values.push(["Limite", formatCurrency(row.limit.amountCents)], ["Saldo do limite", formatCurrency(row.remainingCents!)]);
  return <article className="space-y-4 py-5" aria-label={row.categoryName}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><span className={`${financeIconClassName} size-10 shrink-0`}><Layers className="size-[18px]" /></span><div><h3 className="text-sm font-semibold">{row.categoryName}</h3>{row.archived && <p className="mt-1 text-xs text-content-subtle">Arquivada</p>}</div></div>
      {row.state && <StatusDotBadge tone={tones[row.state]}>{states[row.state]}</StatusDotBadge>}
    </div>
    <dl className={`grid grid-cols-2 gap-4 text-sm tabular-nums ${row.limit ? "sm:grid-cols-3 xl:grid-cols-5" : "sm:grid-cols-3"}`}>
      {values.map(([label, value]) => <div key={label}><dt className="text-xs text-content-subtle">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
    </dl>
    {row.limit && <div className="space-y-2"><div className="flex justify-between text-xs text-content"><span>Consumo do limite</span><span className="font-semibold tabular-nums">{row.percent!.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</span></div><Progress aria-label={`Consumo de ${row.categoryName}`} value={Math.max(0, Math.min(100, row.percent!))} className={`h-2 bg-surface-elevated ${progressTones[row.state!]}`} /></div>}
    {row.committedCents < 0 && <p className="text-xs text-success">Crédito líquido: os estornos superam as despesas e aumentam o saldo do limite.</p>}
    <div className="flex items-center justify-between gap-3"><BudgetExpenses row={row} />{row.limit && <div className="flex gap-2"><BudgetDialog month={month} categories={[{ id: row.categoryId!, name: row.categoryName, isArchived: row.archived, group: "expense" }]} limit={row.limit} /><BudgetRemove categoryId={row.categoryId!} competenceMonth={month} /></div>}</div>
  </article>;
}
