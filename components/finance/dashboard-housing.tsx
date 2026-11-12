"use client";

import { Check, TriangleAlert } from "lucide-react";
import Image from "next/image";

import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { DashboardHousingItems } from "@/components/finance/dashboard-housing-items";
import { DashboardHousingMeter } from "@/components/finance/dashboard-housing-meter";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { DASHBOARD_HOUSING_REFERENCE_PERCENT } from "@/lib/dashboard-housing";
import type { DashboardHousingProps } from "@/lib/interfaces/dashboard-housing";
import { cn } from "@/lib/utils";

export function DashboardHousing({ data }: DashboardHousingProps) {
  if (!data.items.length) {
    return (
      <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px]">
        <h2 className="text-sm font-semibold text-content-strong">Moradia</h2>
        <div className="mt-4">
          <FinanceEmptyState title="Nenhum gasto com moradia" description="Lançamentos das categorias Moradia e Contas da casa aparecem aqui." />
        </div>
      </section>
    );
  }
  const over = data.sharePercent !== null && data.sharePercent > DASHBOARD_HOUSING_REFERENCE_PERCENT;
  const StatusIcon = over ? TriangleAlert : Check;
  return (
    <section className="@container min-w-0 rounded-[20px] border border-border bg-card p-[23px]">
      <h2 className="text-sm font-semibold text-content-strong">Moradia</h2>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-content">Quanto você gasta pra morar</p>
          <DashboardCardsMoney cents={data.totalCents} className="mt-1 block text-[40px] leading-[44px] font-bold text-content-strong" />
        </div>
        <Image src="/images/housing-house.webp" width={525} height={350} alt="" unoptimized className="-my-5 -mr-2 h-24 w-auto shrink-0 object-contain" />
      </div>
      {data.sharePercent !== null && (
        <p className={cn("mt-2 flex items-center gap-1.5 text-xs", over ? "text-destructive" : "text-success")}>
          <StatusIcon className="size-3.5" aria-hidden />
          <span className="font-semibold">{`${data.sharePercent}% do salário`}</span>
          <span className="text-content">{`referência: até ${DASHBOARD_HOUSING_REFERENCE_PERCENT}%`}</span>
        </p>
      )}
      <DashboardHousingMeter sharePercent={data.sharePercent} />
      <p className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">O que entra na conta</p>
      <DashboardHousingItems items={data.items} />
    </section>
  );
}
