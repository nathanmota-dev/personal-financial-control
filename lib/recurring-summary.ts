import type { RecurringMonthSummary, RecurringTemplateRow } from "@/lib/interfaces/recurring";
import type { RecurringOccurrencesData } from "@/lib/interfaces/recurring-occurrences";
import { isRecurringTemplateVisibleInMonth } from "@/lib/recurring-calendar";
import { isRecurringRecorded } from "@/lib/recurring-status";

function sumAmounts(templates: RecurringTemplateRow[]) {
  return templates.reduce((total, template) => total + template.amountCents, 0);
}

/** Totals of the active recurring rules scheduled for `month`; a rule is recorded when generated or linked to a real entry. */
export function summarizeRecurringMonth(templates: RecurringTemplateRow[], month: string, occurrences: RecurringOccurrencesData): RecurringMonthSummary {
  const scheduled = templates.filter((template) => isRecurringTemplateVisibleInMonth(template, month));
  const ofType = (type: RecurringTemplateRow["type"]) => scheduled.filter((template) => template.type === type);
  const isRecorded = (template: RecurringTemplateRow) => isRecurringRecorded(occurrences, template.id, month);
  const expenses = ofType("expense");
  const expenseCents = sumAmounts(expenses);
  const incomeCents = sumAmounts(ofType("income"));
  const investmentCents = sumAmounts(ofType("investment_contribution"));
  const recorded = expenses.filter(isRecorded);
  const recordedPlannedExpenseCents = sumAmounts(recorded);
  return {
    expenseCents,
    incomeCents,
    investmentCents,
    recordedExpenseCents: recorded.reduce((total, template) => total + (occurrences.byTemplate[template.id]?.recordedCents ?? template.amountCents), 0),
    recordedPlannedExpenseCents,
    pendingExpenseCents: expenseCents - recordedPlannedExpenseCents,
    freeCents: incomeCents - expenseCents - investmentCents,
    scheduledCount: scheduled.length,
    recordedCount: scheduled.filter(isRecorded).length,
    pausedCount: templates.filter((template) => template.status === "paused").length,
  };
}

/** Active rules scheduled for `month`, by due day and then by the largest amount. */
export function buildRecurringAgenda(templates: RecurringTemplateRow[], month: string) {
  return templates
    .filter((template) => isRecurringTemplateVisibleInMonth(template, month))
    .sort((left, right) => left.dayOfMonth - right.dayOfMonth || right.amountCents - left.amountCents);
}
