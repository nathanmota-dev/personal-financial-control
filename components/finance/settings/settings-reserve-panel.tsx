"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { InvestmentPortfolioSettings } from "@/components/finance/investment-portfolio-settings";
import type { SettingsReservePanelProps } from "@/lib/interfaces/settings";

/** Manual reserve settings. With linked positions the reserve comes from the bank and is set in Investments instead. */
export function SettingsReservePanel({ projection }: SettingsReservePanelProps) {
  if (projection?.source === "bank") {
    return (
      <section aria-label="Reserva" className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
        <DashboardCardIllustration src="/images/balance-wallet.webp" />
        <h2 className="text-lg font-semibold leading-[25px]">Reserva pelo Open Finance</h2>
        <p className="mt-1 pr-16 text-xs leading-5 text-content-muted">Suas posições vêm do banco, então a reserva usa os valores reais e não precisa de saldo de referência nem de taxa. Defina quanto do total é reserva na visão geral de Investimentos.</p>
        <Link href="/investments" className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-content-strong transition-colors hover:border-primary hover:text-primary">
          Definir reserva
          <ArrowUpRight aria-hidden className="size-3.5" />
        </Link>
      </section>
    );
  }
  return <InvestmentPortfolioSettings projection={projection} />;
}
