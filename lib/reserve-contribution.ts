import { findCatalogCategory } from "@/lib/category-markers";
import type { InvestmentMovement } from "@/lib/investment-projection";
import { addMonthsToMonth, buildDateInMonth } from "@/lib/utils/finance-month";

export const RESERVE_CATEGORY_NAME = "Reserva de emergência";

/** A category is the reserve's when its name or alias matches the catalog entry, such as "Reserva". */
export function isReserveCategory(category: { name: string; group: string }) {
  return category.group === "investment" && findCatalogCategory(category.name)?.name === RESERVE_CATEGORY_NAME;
}

/** One contribution per month from the month after `asOfDate`, on the same day, for the saved amount. */
export function buildMonthlyContributions(asOfDate: string, monthlyCents: number, months: number): InvestmentMovement[] {
  if (monthlyCents <= 0) return [];
  const day = Number(asOfDate.slice(8, 10));
  return Array.from({ length: months }, (_, index) => {
    const month = addMonthsToMonth(asOfDate.slice(0, 7), index + 1);
    return { id: `reserve-plan:${month}`, date: buildDateInMonth(month, day), amountCents: monthlyCents, direction: "contribution" as const, source: "recurring" as const };
  });
}

/** Active in the month of `asOfDate`, so the default shows what is planned now. */
export function recurringMonthlyCents(templates: { amountCents: number; startMonth: string; endMonth: string | null }[], asOfDate: string) {
  const month = asOfDate.slice(0, 7);
  return templates.filter((template) => template.startMonth <= month && (!template.endMonth || template.endMonth >= month)).reduce((total, template) => total + template.amountCents, 0);
}
