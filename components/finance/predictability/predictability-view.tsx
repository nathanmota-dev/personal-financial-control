import type { PredictabilityViewProps } from "@/app/interfaces/predictability";
import { ErrorPanel } from "@/components/finance/error-panel";
import { PageHeader } from "@/components/finance/page-header";

import { PredictabilityBreakdown } from "./predictability-breakdown";
import { PredictabilityCycleNav } from "./predictability-cycle-nav";
import { PredictabilityExplorer } from "./predictability-explorer";
import { PredictabilityHero } from "./predictability-hero";

const gridClassName = "grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]";

export function PredictabilityView({ predictability, loadError }: PredictabilityViewProps) {
  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        eyebrow="Previsibilidade"
        title="Previsibilidade"
        description="Quanto dá para gastar por dia até o próximo salário, depois da renda, das contas fixas e da fatura. Cada gasto mostra quantos dias ele consome."
        actions={predictability ? <PredictabilityCycleNav cycle={predictability.cycle} /> : undefined}
      />

      {loadError || !predictability ? (
        <ErrorPanel title="Previsibilidade indisponível" message={loadError ?? "Não foi possível montar o ciclo agora."} />
      ) : (
        <div className={gridClassName}>
          <div className="min-w-0 space-y-6 min-[100.0625rem]:space-y-5">
            <PredictabilityHero summary={predictability.summary} cycle={predictability.cycle} />
            <PredictabilityExplorer days={predictability.days} overflowCents={predictability.summary.overflowCents} />
          </div>
          <PredictabilityBreakdown summary={predictability.summary} budgetItems={predictability.budgetItems} />
        </div>
      )}
    </div>
  );
}
