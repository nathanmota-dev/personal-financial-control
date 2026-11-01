export const expenseGroupDefinitions = [
  { key: "fixed", label: "Gastos fixos", amountKey: "fixedCents", shareKey: "fixedShare", color: "var(--chart-1)" },
  { key: "variable", label: "Gastos variáveis", amountKey: "variableCents", shareKey: "variableShare", color: "var(--chart-2)" },
  { key: "unclassified", label: "Sem classificação", amountKey: "unclassifiedCents", shareKey: "unclassifiedShare", color: "var(--chart-3)" },
] as const;

export function formatExpenseShare(share: number | null) {
  return share === null ? "—" : `${(share * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}
