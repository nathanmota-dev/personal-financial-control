import type { PredictabilityResult } from "@/lib/interfaces/predictability";
import { calculatePredictability, resolveCycle } from "@/lib/predictability";

// Pay day on the 1st: R$ 1.500 left over in a 31-day July, a R$ 300 purchase on the 1st, a refund on the 3rd and a dinner today.
export const predictabilityFixture: PredictabilityResult = calculatePredictability({
  today: "2026-07-16",
  cycle: resolveCycle(1, "2026-07-16"),
  budgetItems: [
    { id: "salary", kind: "income", description: "Salário", date: "2026-07-01", amountCents: 500000, accountName: "Conta principal" },
    { id: "rent", kind: "fixed", description: "Aluguel", date: "2026-07-10", amountCents: 270000, accountName: "Conta principal" },
    { id: "card", kind: "credit_card", description: "Fatura Cartão 2026-07", date: "2026-07-10", amountCents: 75000 },
  ],
  expenses: [
    { id: "tenis", date: "2026-07-01", description: "Tênis", amountCents: 30000, accountName: "Conta principal", categoryName: "Compras" },
    { id: "refund", date: "2026-07-03", description: "Estorno", amountCents: -2000, accountName: null, categoryName: null },
    { id: "dinner", date: "2026-07-16", description: "Restaurante", amountCents: 42000, accountName: "Conta principal", categoryName: "Lazer" },
  ],
});
