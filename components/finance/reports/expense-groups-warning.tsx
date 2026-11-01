import { InlineWarning } from "@/components/finance/inline-warning";
import type { ExpenseGroupsWarningProps } from "@/lib/interfaces/expense-groups";

export function ExpenseGroupsWarning({ count }: ExpenseGroupsWarningProps) {
  if (!count) return null;
  return <InlineWarning message={`${count} ${count === 1 ? "gasto recorrente está em categoria variável" : "gastos recorrentes estão em categorias variáveis"}. Revise as categorias em Configurações se eles forem fixos.`} />;
}
