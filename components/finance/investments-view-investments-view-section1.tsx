"use client";

import { InvestmentSummaryCard } from "@/components/finance/investment-summary-card";
import { formatCurrency,formatDateLabel,formatRateFromBps } from "@/lib/finance-ui";
import type { InvestmentsViewSection1Props } from "@/lib/interfaces/render/investments-view-investments-view-section1";
import { Calculator,PiggyBank,TrendingUp } from "lucide-react";

export function InvestmentsViewSection1({ projection }: InvestmentsViewSection1Props) {
  return (
<section className="grid gap-4 md:grid-cols-3">
        <InvestmentSummaryCard
          icon={<PiggyBank className="size-5" />}
          label="Saldo estimado hoje"
          value={projection ? formatCurrency(projection.currentBalanceCents) : "R$ 0,00"}
          detail={
            projection
              ? `Conferido em ${formatDateLabel(projection.checkpointDate)}`
              : "Configure o primeiro checkpoint real."
          }
          tone="cyan"
        />
        <InvestmentSummaryCard
          icon={<TrendingUp className="size-5" />}
          label="Rendimento estimado"
          value={projection ? formatCurrency(projection.estimatedInterestCents) : "R$ 0,00"}
          detail={
            projection
              ? `Desde ${formatDateLabel(projection.checkpointDate)}`
              : "Calculado entre checkpoints."
          }
          tone="amber"
        />
        <InvestmentSummaryCard
          icon={<Calculator className="size-5" />}
          label="Próximo aporte previsto"
          value={projection?.nextContributionDate ? formatDateLabel(projection.nextContributionDate) : "Nenhum"}
          detail={
            projection
              ? `Taxa de ${formatRateFromBps(projection.expectedMonthlyRateBps)}`
              : "Use uma recorrência para planejar."
          }
          tone="sky"
        />
      </section>
  );
}
