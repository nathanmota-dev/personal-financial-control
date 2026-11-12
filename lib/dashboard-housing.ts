import { Building2, CreditCard, House, KeyRound, Wifi, Zap, type LucideIcon } from "lucide-react";

import { defaultCategoryIds } from "@/lib/category-defaults";
import type { BuildDashboardHousingInput, DashboardHousingData, DashboardHousingIconRule } from "@/lib/interfaces/dashboard-housing";

/** Share of the income considered healthy for housing. */
export const DASHBOARD_HOUSING_REFERENCE_PERCENT = 30;
/** The meter ends at twice the reference. */
export const DASHBOARD_HOUSING_METER_MAX_PERCENT = DASHBOARD_HOUSING_REFERENCE_PERCENT * 2;
export const DASHBOARD_HOUSING_VISIBLE_ITEMS = 6;

const HOUSING_CATEGORY_IDS: string[] = [defaultCategoryIds.housing, defaultCategoryIds.householdBills];

const ICON_RULES: DashboardHousingIconRule[] = [
  { pattern: /alug|rent/i, icon: KeyRound },
  { pattern: /cart[aã]o|card/i, icon: CreditCard },
  { pattern: /condom[ií]nio/i, icon: Building2 },
  { pattern: /luz|energia|el[eé]tric/i, icon: Zap },
  { pattern: /internet|wi-?fi|fibra/i, icon: Wifi },
];

export function housingItemIcon(description: string): LucideIcon {
  return ICON_RULES.find((rule) => rule.pattern.test(description))?.icon ?? House;
}

/** Housing spending of the month (Moradia and Contas da casa), grouped by description, biggest first. */
export function buildDashboardHousing({ expenses, incomeCents }: BuildDashboardHousingInput): DashboardHousingData {
  const grouped = new Map<string, number>();
  for (const expense of expenses) {
    if (!expense.category || !HOUSING_CATEGORY_IDS.includes(expense.category.id)) continue;
    grouped.set(expense.description, (grouped.get(expense.description) ?? 0) + expense.amountCents);
  }
  const items = [...grouped]
    .map(([description, amountCents]) => ({ id: description, description, amountCents }))
    .sort((left, right) => right.amountCents - left.amountCents || left.description.localeCompare(right.description));
  const totalCents = items.reduce((sum, item) => sum + item.amountCents, 0);
  return {
    totalCents,
    incomeCents,
    sharePercent: incomeCents > 0 ? Math.round((totalCents / incomeCents) * 100) : null,
    items,
  };
}

/** Position (0–100) of a percentage on the meter. */
export function housingMeterPosition(percent: number) {
  return Math.min(100, Math.max(0, (percent / DASHBOARD_HOUSING_METER_MAX_PERCENT) * 100));
}
