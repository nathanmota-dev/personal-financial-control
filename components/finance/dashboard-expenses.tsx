import { Car, CreditCard, HeartPulse, House, ReceiptText, ShoppingBasket } from "lucide-react";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import type { DashboardExpenseListProps } from "@/lib/interfaces/dashboard";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";

function expenseIcon(description: string) {
  const text = description.toLocaleLowerCase("pt-BR");
  if (/aluguel|moradia|casa/.test(text)) return House;
  if (/cartão|fatura/.test(text)) return CreditCard;
  if (/mercado|alimenta/.test(text)) return ShoppingBasket;
  if (/carro|auto|transporte/.test(text)) return Car;
  if (/saúde|médic|academia/.test(text)) return HeartPulse;
  return ReceiptText;
}

export function DashboardExpenses({ expenses }: DashboardExpenseListProps) {
  return (
      <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px] xl:min-h-[500px]">
        <h2 className="text-xl font-semibold leading-6">
          Maiores gastos do mês
        </h2>
        <p className="mt-1 text-[13px] leading-4 text-content-muted">
          Despesas ordenadas do maior para o menor
        </p>
        <div className="mt-[25px]">
          {expenses.length ? (
            expenses.map((transaction) => {
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
  );
}
