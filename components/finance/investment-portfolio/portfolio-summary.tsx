import {
  Banknote,
  Layers3,
  ShieldCheck,
  Tags,
} from "lucide-react";

import { SummaryMetric } from "@/components/finance/investment-portfolio/summary-metric";
import type { PortfolioSummaryProps } from "@/lib/interfaces/investment-portfolio";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";

export function PortfolioSummary({ dashboard }: PortfolioSummaryProps) {
  const globalIsConfigured = dashboard.globalBalanceCents !== null;
  const updatedDate =
    dashboard.investmentProjection?.asOfDate ?? dashboard.lastValueAsOf;
  const balanceDetail = globalIsConfigured
    ? updatedDate
      ? "Checkpoint de Investimentos · atualizado em " + formatDateLabel(updatedDate)
      : "Fonte oficial: checkpoint de Investimentos"
    : "Configure um checkpoint em Investimentos para reconciliar";

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryMetric
        label={globalIsConfigured ? "Saldo global projetado" : "Patrimônio cadastrado"}
        value={formatCurrency(
          globalIsConfigured
            ? dashboard.globalBalanceCents ?? 0
            : dashboard.totalRegisteredCents
        )}
        detail={balanceDetail}
        icon={<Banknote className="size-4" />}
        tone="cyan"
      />
      <SummaryMetric
        label="Ativos cadastrados"
        value={formatCurrency(dashboard.totalRegisteredCents)}
        detail={dashboard.holdings.length + " posições ativas"}
        icon={<Layers3 className="size-4" />}
        tone="sky"
      />
      <SummaryMetric
        label="Em caixinhas"
        value={formatCurrency(dashboard.totalAllocatedCents)}
        detail={dashboard.purposes.length + " finalidades ativas"}
        icon={<Tags className="size-4" />}
        tone="teal"
      />
      <SummaryMetric
        label={dashboard.overAllocatedCents > 0 ? "Excesso de alocação" : "Não classificado"}
        value={formatCurrency(
          dashboard.overAllocatedCents > 0
            ? dashboard.overAllocatedCents
            : dashboard.unclassifiedCents
        )}
        detail={
          dashboard.overAllocatedCents > 0
            ? "Requer reconciliação"
            : "Ainda sem finalidade"
        }
        icon={<ShieldCheck className="size-4" />}
        tone={dashboard.overAllocatedCents > 0 ? "amber" : "teal"}
      />
    </section>
  );
}
