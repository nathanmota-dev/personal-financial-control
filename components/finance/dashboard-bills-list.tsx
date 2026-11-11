"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { DashboardBillsListProps } from "@/lib/interfaces/dashboard-bills";

export function DashboardBillsList({ bills, disabled, onPay }: DashboardBillsListProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <ul className="mt-3 max-h-[260px] divide-y divide-border overflow-y-auto">
      {bills.map((bill) => (
        <li key={bill.id} className="flex items-center gap-3 py-3.5 text-[13px]">
          <button
            type="button"
            role="checkbox"
            aria-checked={false}
            aria-label={`Marcar ${bill.description} como paga`}
            disabled={disabled}
            onClick={() => onPay(bill.id)}
            className="size-[18px] shrink-0 rounded-full border-[1.5px] border-border transition-colors hover:border-primary hover:bg-primary/10 disabled:opacity-50"
          />
          <span className="min-w-0 flex-1 truncate text-content-strong">{bill.description}</span>
          <span className="shrink-0 font-semibold text-content-strong">{formatCurrency(bill.amountCents)}</span>
        </li>
      ))}
    </ul>
  );
}
