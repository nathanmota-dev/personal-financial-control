"use client";

import {
SummaryCard
} from "@/components/finance/goals/components";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { GoalsViewSection1Props } from "@/lib/interfaces/render/goals-view-goals-view-section1";
import {
CalendarClock,
Flag,
PiggyBank,
ShieldCheck,
Target
} from "lucide-react";

export function GoalsViewSection1({ dashboard }: GoalsViewSection1Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Investido total"
            value={formatCurrency(dashboard.summary.investmentBalanceCents)}
            icon={<PiggyBank className="size-5" />}
            tone="cyan"
          />
          <SummaryCard
            label="Alocado em metas"
            value={formatCurrency(dashboard.summary.totalAllocatedCents)}
            icon={<Target className="size-5" />}
            tone="sky"
          />
          <SummaryCard
            label="Reserva livre"
            value={formatCurrency(dashboard.summary.freeReserveCents)}
            icon={<ShieldCheck className="size-5" />}
            tone={dashboard.summary.freeReserveCents >= 0 ? "teal" : "rose"}
          />
          <SummaryCard
            label="Falta para metas"
            value={formatCurrency(dashboard.summary.remainingToGoalsCents)}
            icon={<Flag className="size-5" />}
            tone="amber"
          />
          <SummaryCard
            label="Aporte mensal necessário"
            value={formatCurrency(dashboard.summary.monthlyRequiredCents)}
            icon={<CalendarClock className="size-5" />}
            tone="violet"
          />
        </section>
  );
}
