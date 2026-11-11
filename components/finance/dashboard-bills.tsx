"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { markRecurringExpensePaidAction } from "@/app/actions/finance";

import { DashboardBillsDayTabs } from "@/components/finance/dashboard-bills-day-tabs";
import { DashboardBillsList } from "@/components/finance/dashboard-bills-list";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { describeBillsDistance, formatBillDay, groupBillsByDay } from "@/lib/dashboard-bills";
import type { DashboardBillsProps } from "@/lib/interfaces/dashboard-bills";

export function DashboardBills({ data }: DashboardBillsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // Paid bills leave the list at once; the refreshed data then stops sending them.
  const [paidIds, setPaidIds] = useState<string[]>([]);
  const bills = data.bills.filter((bill) => !paidIds.includes(bill.id));
  const days = groupBillsByDay(bills);
  const active = days.find((day) => day.dueDate === selectedDate) ?? days[0];

  if (!active) {
    return (
      <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px]">
        <h2 className="text-sm font-semibold text-content-strong">Contas a pagar</h2>
        <div className="mt-4">
          <FinanceEmptyState title="Nenhuma conta a pagar" description="Não há lançamentos recorrentes pendentes até o fim do mês." />
        </div>
      </section>
    );
  }

  const payBill = (id: string) => {
    setPaidIds((current) => [...current, id]);
    startTransition(async () => {
      const result = await markRecurringExpensePaidAction(id, data.today.slice(0, 7));
      if (!result.ok) {
        setPaidIds((current) => current.filter((item) => item !== id));
        toast.error(result.error.message);
        return;
      }
      router.refresh();
    });
  };
  const totalCents = bills.reduce((sum, bill) => sum + bill.amountCents, 0);
  const paidCount = data.paidCount + data.bills.length - bills.length;
  return (
    <section className="@container min-w-0 rounded-[20px] border border-border bg-card p-[23px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-content-strong">
            Contas a pagar <span className="font-normal text-content">{`• dia ${formatBillDay(active.day)}`}</span>
          </h2>
          <DashboardCardsMoney cents={totalCents} className="mt-4 block text-[40px] leading-[44px] font-bold text-content-strong" />
          <p className="mt-2 text-xs text-content">{`${describeBillsDistance(data.daysLeft)} · ${paidCount} de ${data.totalCount} pagas`}</p>
        </div>
        <Image src="/images/bills-calendar.webp" width={96} height={96} alt="" unoptimized className="-mt-3 -mr-2 size-24 shrink-0 object-contain" />
      </div>
      <DashboardBillsDayTabs days={days} selected={active.dueDate} onSelect={setSelectedDate} />
      <DashboardBillsList bills={active.bills} disabled={isPending} onPay={payBill} />
    </section>
  );
}
