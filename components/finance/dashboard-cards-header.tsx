"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { CreditCardChip } from "@/components/finance/credit-card-chip";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { Button } from "@/components/ui/button";
import type { DashboardCardsHeaderProps } from "@/lib/interfaces/dashboard-cards";

export function DashboardCardsHeader({ monthLabel, totalCents, month, canPrevious, canNext, onPrevious, onNext }: DashboardCardsHeaderProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-content-strong">Cartões</h2>
          <p className="mt-6 text-[13px] font-medium text-content">{`Fatura de ${monthLabel}`}</p>
          <DashboardCardsMoney cents={totalCents} className="mt-1 block text-[40px] leading-[44px] font-bold text-content-strong" />
        </div>
        <div aria-hidden className="relative mt-1 mr-2 h-[40px] w-[60px] shrink-0">
          <div className="absolute inset-x-2 -bottom-1 h-3 rounded-[50%] bg-black/25 blur-[6px]" />
          <div className="absolute inset-0 -rotate-[16deg] skew-x-[-6deg] rounded-[9px] bg-[linear-gradient(135deg,#4f8ff7_0%,#2563eb_55%,#1e40af_100%)] shadow-[0_10px_14px_-4px_rgba(30,64,175,0.55)]">
                        <CreditCardChip className="absolute top-1/2 left-[7px] h-[12px] w-[15px] -translate-y-1/2 text-[#f3d27a]" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button asChild variant="outline">
          <Link href={`/credit-card?month=${month}`}>Ver fatura</Link>
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon-sm" className="rounded-full" aria-label="Cartão anterior" disabled={!canPrevious} onClick={onPrevious}>
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="icon-sm" className="rounded-full" aria-label="Próximo cartão" disabled={!canNext} onClick={onNext}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
