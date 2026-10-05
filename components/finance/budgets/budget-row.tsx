import { BudgetForm } from "./budget-form";
import { BudgetRemove } from "./budget-remove";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import type { BudgetRowProps } from "@/lib/interfaces/budgets";

const states = { below: "Abaixo de 80%", warning: "Atenção: de 80% a menos de 100%", reached: "Limite atingido ou ultrapassado" };
const tones = { below: "text-success", warning: "text-warning", reached: "text-danger" };

export function BudgetCategoryRow({ row, month }: BudgetRowProps) {
  return <article className="space-y-4 border-b border-border py-6" aria-label={row.categoryName}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-lg font-semibold text-content-strong">{row.categoryName}{row.archived && <span className="ml-2 text-xs font-normal text-content">Arquivada</span>}</h3>
      {row.state && <p className={`text-sm font-medium ${tones[row.state]}`}>{states[row.state]}</p>}
    </div>
    <dl className="grid grid-cols-2 gap-4 text-sm tabular-nums sm:grid-cols-3 lg:grid-cols-6">
      {[["Limite", row.limit ? formatCurrency(row.limit.amountCents) : "Sem limite"], ["Realizado", formatCurrency(row.postedCents)], ["Pendente", formatCurrency(row.pendingCents)], ["Comprometido", formatCurrency(row.committedCents)], ["Saldo do limite", row.remainingCents === null ? "—" : formatCurrency(row.remainingCents)], ["Consumo", row.percent === null ? "—" : `${row.percent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`]].map(([label, value]) => <div key={label}><dt className="text-content">{label}</dt><dd className="mt-1 font-semibold text-content-strong">{value}</dd></div>)}
    </dl>
    {row.limit && <progress aria-label={`Consumo de ${row.categoryName}`} value={Math.max(0, Math.min(100, row.percent!))} max={100} className="h-2 w-full accent-brand" />}
    {row.committedCents < 0 && <p className="text-sm text-content">Crédito líquido: os estornos superam as despesas e aumentam o saldo do limite.</p>}
    {row.limit && <details><summary className="cursor-pointer text-sm text-brand">Editar limite de {row.categoryName}</summary><div className="mt-3 flex flex-wrap items-end gap-4"><BudgetForm month={month} categories={[{ id: row.categoryId!, name: row.categoryName, isArchived: row.archived, group: "expense" }]} limit={row.limit} /><BudgetRemove categoryId={row.categoryId!} competenceMonth={month} /></div></details>}
    <details><summary className="cursor-pointer text-sm text-brand">Conferir despesas de {row.categoryName} ({row.expenses.length})</summary>
      {row.expenses.length === 0 ? <p className="mt-3 text-sm text-content">Nenhuma despesa nesta competência.</p> : <ul className="mt-3 divide-y divide-border">{row.expenses.map((expense) => <li key={expense.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><p className="font-medium">{expense.description}</p><p className="text-content">{expense.accountName} · {expense.origin} · {formatDateLabel(expense.date)} · {expense.pending ? "Pendente" : "Realizado"}</p></div><p className="tabular-nums">{formatCurrency(expense.amountCents)}{expense.amountCents < 0 && " (crédito)"}</p></li>)}</ul>}
    </details>
  </article>;
}
