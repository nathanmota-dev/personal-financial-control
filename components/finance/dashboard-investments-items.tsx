"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { DASHBOARD_INVESTMENTS_VISIBLE_ITEMS } from "@/lib/dashboard-investments";
import type { DashboardInvestmentsItemsProps } from "@/lib/interfaces/dashboard-investments";
import { cn } from "@/lib/utils";

export function DashboardInvestmentsItems({ items }: DashboardInvestmentsItemsProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <ul className="mt-3">
      {items.slice(0, DASHBOARD_INVESTMENTS_VISIBLE_ITEMS).map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
          <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-content-strong">
            <span className={cn("size-2 shrink-0 rounded-full", item.group === "reserve" ? "bg-primary" : "bg-[#ff3b6b]")} aria-hidden />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="text-[13px] font-semibold text-content-strong">{formatCurrency(item.amountCents)}</span>
        </li>
      ))}
    </ul>
  );
}
