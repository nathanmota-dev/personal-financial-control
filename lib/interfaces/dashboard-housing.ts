import type { LucideIcon } from "lucide-react";

import type { DashboardExpense } from "@/lib/interfaces/dashboard";

export type DashboardHousingItem = {
  id: string;
  description: string;
  amountCents: number;
};

export type DashboardHousingData = {
  totalCents: number;
  /** Income of the month the share is measured against. */
  incomeCents: number;
  /** Share of the income spent on housing, in percent (null without income). */
  sharePercent: number | null;
  items: DashboardHousingItem[];
};

export type BuildDashboardHousingInput = {
  expenses: DashboardExpense[];
  incomeCents: number;
};

export type DashboardHousingProps = { data: DashboardHousingData };

export type DashboardHousingMeterProps = { sharePercent: number | null };

export type DashboardHousingItemsProps = { items: DashboardHousingItem[] };

export type DashboardHousingIconRule = { pattern: RegExp; icon: LucideIcon };
