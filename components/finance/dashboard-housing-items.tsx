"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { DASHBOARD_HOUSING_VISIBLE_ITEMS, housingItemIcon } from "@/lib/dashboard-housing";
import type { DashboardHousingItemsProps } from "@/lib/interfaces/dashboard-housing";

export function DashboardHousingItems({ items }: DashboardHousingItemsProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 @md:grid-cols-2">
      {items.slice(0, DASHBOARD_HOUSING_VISIBLE_ITEMS).map((item) => {
        const Icon = housingItemIcon(item.description);
        return (
          <li key={item.id} className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs text-content">{item.description}</span>
              <span className="block text-[13px] font-semibold text-content-strong">{formatCurrency(item.amountCents)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
