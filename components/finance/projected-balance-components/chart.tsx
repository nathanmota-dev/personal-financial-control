"use client";

import { useMemo } from "react";

import type {
ProjectedBalanceChartPoint,
ProjectedBalanceChartProps,
} from "@/app/interfaces/projected-balance";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { formatDateLabel } from "@/lib/finance-ui";

import { ProjectedBalanceChartPlot } from "./chart-plot";
import { statusLabels } from "./labels";

export function ProjectedBalanceChart({
  daily,
  minimumReserveCents,
}: ProjectedBalanceChartProps) {
  const data = useMemo<ProjectedBalanceChartPoint[]>(
    () =>
      daily.map((day) => ({
        date: day.date,
        label: formatDateLabel(day.date),
        balance: day.projectedBalanceCents / 100,
        zero: 0,
        minimumReserve:
          minimumReserveCents > 0 ? minimumReserveCents / 100 : undefined,
        status: day.status,
        statusLabel: statusLabels[day.status],
      })),
    [daily, minimumReserveCents]
  );

  const legend = [
    { key: "balance", label: "Saldo projetado", color: "var(--chart-1)", dashed: false },
    ...(minimumReserveCents > 0 ? [{ key: "minimumReserve", label: "Reserva mínima", color: "var(--warning)", dashed: true }] : []),
    { key: "zero", label: "Zero", color: "var(--destructive)", dashed: true },
  ];

  return (
    <section className="relative flex min-w-0 flex-col rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/evolution-chart.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Evolução diária</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Saldo previsto em cada dia do período, com a reserva mínima como referência</p>
      <div className="mt-[18px] flex flex-wrap gap-x-5 gap-y-2">
        {legend.map((item) => (
          <span key={item.key} className="flex items-center gap-[7px] text-[11px] text-content">
            <svg width="14" height="9" aria-hidden="true">
              {item.dashed ? <line x1="0" y1="4.5" x2="14" y2="4.5" stroke={item.color} strokeWidth="2" strokeDasharray="3 2" /> : <circle cx="4.5" cy="4.5" r="4.5" fill={item.color} />}
            </svg>
            {item.label}
          </span>
        ))}
      </div>
      <ProjectedBalanceChartPlot data={data} minimumReserveCents={minimumReserveCents} />
    </section>
  );
}
