"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Image from "next/image";

import { DashboardBalanceForecastBar } from "@/components/finance/dashboard-balance-forecast-bar";
import { DashboardBalanceForecastLegend } from "@/components/finance/dashboard-balance-forecast-legend";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { buildDashboardBalanceForecast } from "@/lib/dashboard-balance-forecast";
import type { DashboardBalanceForecastProps } from "@/lib/interfaces/dashboard-balance-forecast";
import { cn } from "@/lib/utils";

export function DashboardBalanceForecast({ totals }: DashboardBalanceForecastProps) {
  const { protect } = useFinancialFormatter();
  const data = buildDashboardBalanceForecast(totals);
  const negative = data.freeCents < 0;
  const TrendIcon = negative ? ArrowDownRight : ArrowUpRight;
  // The wallet sits over the middle of the green (free balance) segment, which ends the bar.
  const freeWidth = data.segments.find((segment) => segment.key === "free")?.width ?? 0;
  return (
    <section aria-label="Saldo previsto" className="@container min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <h2 className="text-sm font-semibold text-content-strong">Saldo previsto</h2>
      <div className="relative mt-4 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <DashboardCardsMoney cents={data.freeCents} className="block text-[48px] leading-[52px] font-bold text-content-strong" />
          <span aria-hidden className="hidden h-10 w-px bg-border sm:block" />
          <div>
            {data.freePercent !== null && (
              <p className={cn("flex items-center gap-1.5 text-xs font-semibold", negative ? "text-destructive" : "text-success")}>
                <TrendIcon className="size-3.5" aria-hidden />
                {protect(`${data.freePercent}% da receita livre`)}
              </p>
            )}
            <p className="text-xs text-content">valor estimado após pagar todas as contas</p>
          </div>
        </div>
        <div aria-hidden className="absolute -top-11 h-24 w-24 translate-x-1/2" style={{ right: `${freeWidth / 2}%` }}>
          <div className="absolute inset-x-0 -bottom-2 h-5 rounded-[50%] bg-black/50 blur-[7px]" />
          <Image src="/images/balance-wallet.webp" width={450} height={450} alt="" unoptimized className="relative h-full w-full -rotate-[24deg] skew-x-[-8deg] object-contain" />
        </div>
      </div>
      <DashboardBalanceForecastBar segments={data.segments} />
      <DashboardBalanceForecastLegend incomeCents={data.incomeCents} segments={data.segments} />
    </section>
  );
}
