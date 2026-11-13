import type { DemoFixture } from "@/lib/demo/contracts";
import { categoryIds, id } from "./support";

/** Every competence month of the demo year, so the budgets page has limits in any 2026 month. */
const budgetMonths = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, "0")}`);

/**
 * Limits sized against the demo spending: most categories stay within the limit,
 * while groceries exceed it in the reference month. Leisure is left without a
 * limit so the budgets flow can create one from scratch.
 */
const budgetLimits = [
  { category: "rent", amountCents: 120000 },
  { category: "utilities", amountCents: 45000 },
  { category: "groceries", amountCents: 90000 },
  { category: "restaurants", amountCents: 40000 },
  { category: "transport", amountCents: 30000 },
  { category: "health", amountCents: 70000 },
  { category: "food", amountCents: 30000 },
  { category: "education", amountCents: 20000 },
] as const;

export const monthlyBudgets: DemoFixture["monthlyBudgets"] = budgetMonths.flatMap((month, monthIndex) =>
  budgetLimits.map((limit, limitIndex) => ({
    id: id("94000000-0000-4000-8000", monthIndex * budgetLimits.length + limitIndex + 1),
    categoryId: categoryIds[limit.category],
    competenceMonth: month,
    amountCents: limit.amountCents,
  })),
);
