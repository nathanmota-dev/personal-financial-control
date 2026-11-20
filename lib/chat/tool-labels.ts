const labels: Record<string, string> = {
  list_finance_references: "contas e categorias",
  list_transactions: "lançamentos",
  get_transaction: "lançamento",
  list_credit_card_charges: "compras no cartão",
  get_credit_card_charge: "compra no cartão",
  list_pending_categories: "lançamentos a classificar",
  get_spending_summary: "gastos",
  get_budget_overview: "orçamento",
  get_credit_card_invoices: "faturas",
  get_spending_capacity: "saldo e limite do mês",
};

export function chatToolLabel(toolName: string) {
  return labels[toolName] ?? "dados";
}

export const CHAT_SUGGESTIONS = [
  "Qual foi meu maior gasto do mês?",
  "Ainda posso gastar este mês?",
  "Quanto vem de fatura no cartão?",
] as const;
