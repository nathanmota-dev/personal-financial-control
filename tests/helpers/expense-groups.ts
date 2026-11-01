import type { ReportRecords } from "@/lib/interfaces/reports";

export function expenseGroupRecords(): ReportRecords {
  const expense = { expenseDate: "2026-06-05", competenceMonth: "2026-06", account: { name: "Principal" } };
  const fixed = { id: "rent", name: "Moradia", group: "fixed_expense" };
  const variable = { id: "food", name: "Alimentação", group: "variable_expense" };
  return {
    expenses: [
      { ...expense, id: "rent", description: "Aluguel", amountCents: 320000, category: fixed },
      { ...expense, id: "food", description: "Mercado", amountCents: 150000, category: variable },
      { ...expense, id: "refund", description: "Estorno", amountCents: -10000, category: variable },
      { ...expense, id: "card", description: "Compra parcelada", amountCents: 40000, category: variable, expenseDate: "2026-05-20", account: { name: "Cartão" } },
      { ...expense, id: "outside", description: "Outro mês", amountCents: 999999, category: null, competenceMonth: "2026-07" },
    ],
    activeTransactions: [
      { id: "rent", recurringTemplateId: "rent-template" },
      { id: "food", recurringTemplateId: "food-template" },
      { id: "refund", recurringTemplateId: null },
    ],
    installments: [{ id: "card" }],
  } as unknown as ReportRecords;
}
