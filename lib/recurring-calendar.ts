import { format } from "date-fns";

import type {
  RecurringCalendarEvent,
  RecurringTemplateRow,
} from "@/lib/interfaces/recurring";

export function isRecurringTemplateVisibleInMonth(
  template: RecurringTemplateRow,
  month: string
) {
  return (
    template.status === "active" &&
    template.startMonth <= month &&
    (!template.endMonth || template.endMonth >= month)
  );
}

export function buildRecurringCalendarEvents(
  month: string,
  templates: RecurringTemplateRow[]
): RecurringCalendarEvent[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return templates
    .filter((template) => isRecurringTemplateVisibleInMonth(template, month))
    .map((template) => ({
      id: template.id,
      date: new Date(year, monthNumber - 1, Math.min(template.dayOfMonth, lastDay), 12),
      description: template.description,
      amountCents: template.amountCents,
      type: template.type,
      accountName: template.account?.name ?? "Conta não informada",
      categoryName: template.category?.name ?? "Sem categoria",
      isGenerated: template.lastGeneratedMonth === month,
    }))
    .sort(
      (left, right) =>
        left.date.getTime() - right.date.getTime() ||
        left.description.localeCompare(right.description)
    );
}

export function getMonthFromDate(date: Date) {
  return format(date, "yyyy-MM");
}
