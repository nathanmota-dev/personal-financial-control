import type {
  BuildDashboardBillsInput,
  DashboardBill,
  DashboardBillDay,
  DashboardBillsData,
} from "@/lib/interfaces/dashboard-bills";
import { buildDateInMonth } from "@/lib/utils/finance-month";

export const DASHBOARD_BILLS_VISIBLE_DAYS = 5;

/** Unpaid recurring expenses due from `today` until the end of its month, soonest first. */
export function buildDashboardBills({ today, templates, paidTemplateIds }: BuildDashboardBillsInput): DashboardBill[] {
  const month = today.slice(0, 7);
  return templates
    .filter((template) => template.startMonth <= month && (!template.endMonth || template.endMonth >= month))
    .filter((template) => !paidTemplateIds.has(template.id))
    .map((template) => ({
      id: template.id,
      description: template.description,
      amountCents: template.amountCents,
      dueDate: buildDateInMonth(month, template.dayOfMonth),
    }))
    // A bill is paid on its due date, so only later days are still open.
    .filter((bill) => bill.dueDate > today)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || right.amountCents - left.amountCents);
}

/** Days after `today` until the last day of its month. */
export function daysLeftInMonth(today: string) {
  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate() - day;
}

export function summarizeDashboardBills(input: BuildDashboardBillsInput): DashboardBillsData {
  const month = input.today.slice(0, 7);
  const monthly = input.templates.filter((template) => template.startMonth <= month && (!template.endMonth || template.endMonth >= month));
  return {
    today: input.today,
    daysLeft: daysLeftInMonth(input.today),
    totalCount: monthly.length,
    paidCount: monthly.filter((template) => input.paidTemplateIds.has(template.id) || buildDateInMonth(month, template.dayOfMonth) <= input.today).length,
    bills: buildDashboardBills(input),
  };
}

export function groupBillsByDay(bills: DashboardBill[]): DashboardBillDay[] {
  const days = new Map<string, DashboardBill[]>();
  for (const bill of bills) days.set(bill.dueDate, [...(days.get(bill.dueDate) ?? []), bill]);
  return [...days].map(([dueDate, dayBills]) => ({ dueDate, day: Number(dueDate.slice(8, 10)), bills: dayBills }));
}


export function formatBillDay(day: number) {
  return String(day).padStart(2, "0");
}

export function describeBillsDistance(days: number) {
  if (days <= 0) return "hoje";
  return days === 1 ? "amanhã" : `em ${days} dias`;
}
