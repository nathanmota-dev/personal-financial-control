import type { RecurringMonthSummary, RecurringTemplateRow } from "@/lib/interfaces/recurring";
import { isRecurringTemplateVisibleInMonth } from "@/lib/recurring-calendar";

function sumAmounts(templates: RecurringTemplateRow[]) {
  return templates.reduce((total, template) => total + template.amountCents, 0);
}

/** Totals of the active recurring rules scheduled for `month`. */
export function summarizeRecurringMonth(templates: RecurringTemplateRow[], month: string): RecurringMonthSummary {
  const scheduled = templates.filter((template) => isRecurringTemplateVisibleInMonth(template, month));
  const ofType = (type: RecurringTemplateRow["type"]) => scheduled.filter((template) => template.type === type);
  const expenses = ofType("expense");
  const expenseCents = sumAmounts(expenses);
  const incomeCents = sumAmounts(ofType("income"));
  const investmentCents = sumAmounts(ofType("investment_contribution"));
  const generatedExpenseCents = sumAmounts(expenses.filter((template) => template.lastGeneratedMonth === month));
  return {
    expenseCents,
    incomeCents,
    investmentCents,
    generatedExpenseCents,
    pendingExpenseCents: expenseCents - generatedExpenseCents,
    freeCents: incomeCents - expenseCents - investmentCents,
    scheduledCount: scheduled.length,
    generatedCount: scheduled.filter((template) => template.lastGeneratedMonth === month).length,
    pausedCount: templates.filter((template) => template.status === "paused").length,
  };
}

/** Active rules scheduled for `month`, by due day and then by the largest amount. */
export function buildRecurringAgenda(templates: RecurringTemplateRow[], month: string) {
  return templates
    .filter((template) => isRecurringTemplateVisibleInMonth(template, month))
    .sort((left, right) => left.dayOfMonth - right.dayOfMonth || right.amountCents - left.amountCents);
}
