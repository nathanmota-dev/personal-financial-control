import {
  Car,
  CreditCard,
  HeartPulse,
  House,
  ReceiptText,
  ShoppingBasket,
} from "lucide-react";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import type { DashboardDetailsProps } from "@/lib/interfaces/dashboard";
import {
  accountTypeLabels,
  formatCurrency,
  formatDateLabel,
} from "@/lib/finance-ui";

function expenseIcon(description: string) {
  const text = description.toLocaleLowerCase("pt-BR");
  if (/aluguel|moradia|casa/.test(text)) return House;
  if (/cartão|fatura/.test(text)) return CreditCard;
  if (/mercado|alimenta/.test(text)) return ShoppingBasket;
  if (/carro|auto|transporte/.test(text)) return Car;
  if (/saúde|médic|academia/.test(text)) return HeartPulse;
  return ReceiptText;
}

export function DashboardDetails({
  dashboard,
  expenses,
}: DashboardDetailsProps) {
  const topExpenses = [...expenses]
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 5);
  const projection = dashboard.investmentProjection;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,658fr)_minmax(0,436fr)]">
      <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px] xl:min-h-[500px]">
        <h2 className="text-xl font-semibold leading-6">
          Maiores gastos do mês
        </h2>
        <p className="mt-1 text-[13px] leading-4 text-content-muted">
          Despesas ordenadas do maior para o menor
        </p>
        <div className="mt-[25px]">
          {topExpenses.length ? (
            topExpenses.map((transaction) => {
              const Icon = expenseIcon(
                `${transaction.description} ${transaction.category?.name ?? ""}`,
              );
              return (
                <div
                  key={transaction.id}
                  className="flex min-h-[75px] gap-[15px]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-brand-soft text-brand">
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="mb-[17px] flex min-w-0 flex-1 justify-between gap-3 border-b border-border pb-[17px]">
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm leading-[17px] font-semibold"
                        title={transaction.description}
                      >
                        {transaction.description}
                      </p>
                      <p className="mt-[7px] text-xs leading-[15px] text-content-subtle">
                        {transaction.category?.name ?? "Sem categoria"} ·{" "}
                        {formatDateLabel(transaction.expenseDate)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm leading-[17px] font-semibold">
                        {formatCurrency(transaction.amountCents)}
                      </p>
                      <p className="mt-[7px] text-[11px] leading-[15px] text-content-subtle">
                        {transaction.account?.name ?? "Conta"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <FinanceEmptyState
              title="Sem despesas relevantes"
              description="Não há gastos lançados para esta competência."
            />
          )}
        </div>
      </section>
      <div className="grid content-start gap-6">
        <section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 xl:h-[238px]">
          <h2 className="text-lg font-semibold">Saldos por conta</h2>
          <p className="mt-1 text-xs text-content-muted">
            Posição atual das contas
          </p>
          <div className="mt-[23px] max-h-[144px] space-y-[13px] overflow-y-auto pr-1">
            {dashboard.accountBalances.map((account) => (
              <div key={account.id} className="flex items-center gap-3">
                <span className="size-[9px] shrink-0 rounded-full bg-chart-3" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">
                    {account.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-content-subtle">
                    {accountTypeLabels[account.type]}
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
            {!dashboard.accountBalances.length && (
              <p className="text-sm text-content-muted">
                Nenhuma conta cadastrada.
              </p>
            )}
          </div>
        </section>
        <section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 xl:h-[238px]">
          <h2 className="text-lg font-semibold">Carteira consolidada</h2>
          <p className="mt-1 text-xs text-content-muted">
            Estimativa atual dos investimentos
          </p>
          {projection ? (
            <>
              <div className="mt-[22px] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-content-muted">
                    Saldo estimado atual
                  </p>
                  <p className="mt-1 text-[25px] font-[650] tracking-[-0.8px]">
                    {formatCurrency(projection.currentBalanceCents)}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-soft px-[13px] py-[9px]">
                  <p className="text-[10px] text-content">
                    Rendimento estimado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand">
                    {projection.estimatedInterestCents > 0 ? "+ " : ""}
                    {formatCurrency(projection.estimatedInterestCents)}
                  </p>
                </div>
              </div>
              <div className="mt-[15px] grid grid-cols-3 gap-2 border-t border-border pt-[13px]">
                <div>
                  <p className="text-[11px] text-content-subtle">Referência</p>
                  <p className="mt-1.5 text-xs font-semibold">
                    {formatDateLabel(projection.checkpointDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-content-subtle">
                    Taxa esperada
                  </p>
                  <p className="mt-1.5 text-xs font-semibold">
                    {(projection.expectedMonthlyRateBps / 100).toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2 },
                    )}
                    % a.m.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-content-subtle">
                    Próximo aporte
                  </p>
                  <p className="mt-1.5 text-xs font-semibold">
                    {projection.nextContributionDate
                      ? formatDateLabel(projection.nextContributionDate)
                      : "Não previsto"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-8 text-sm text-content-muted">
              A carteira ainda não foi configurada.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
