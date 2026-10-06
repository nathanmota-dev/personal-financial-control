import { MonthlyInsight } from "@/components/finance/reports/monthly-insight";
import { MonthlySummaryMetrics } from "@/components/finance/reports/monthly-summary-metrics";
import { MonthlySummaryHighlights } from "@/components/finance/reports/monthly-summary-highlights";
import { ReportEntries } from "@/components/finance/reports/entries";
import { Card, CardContent } from "@/components/ui/card";
import { formatMonthLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";
import type { MonthlyRetrospectiveProps } from "@/lib/interfaces/monthly-retrospective";

export function MonthlySummaryContent({ summary }: MonthlyRetrospectiveProps) {
  return <div className="min-w-0 space-y-4">
    <p className="text-sm leading-6 text-content">{summary.partial ? "Resumo parcial: mês em andamento. Os valores ainda podem mudar; não comparamos conclusivamente com um mês completo." : summary.future ? "Mês futuro: valores previstos por competência, sem comparação conclusiva." : "Resumo por competência, com lançamentos pendentes e efetivados e parcelas do cartão."}</p>
    {!summary.entries.length && <p className="text-sm text-content">Sem registros no mês. A ausência de registros não comprova ausência de movimentação.</p>}
    <MonthlySummaryMetrics summary={summary} />
    <MonthlySummaryHighlights summary={summary} />
    <section className="space-y-4" aria-label="Mudanças do mês">
      <h3 className="text-lg font-semibold">Mudanças em relação a {formatMonthLabel(summary.previousPeriod)}</h3>
      {summary.insights.length ? <ul className={cn("grid items-start gap-4", summary.insights.length > 1 && "lg:grid-cols-2", summary.insights.length > 2 && "xl:grid-cols-3")}>{summary.insights.map((insight) => <MonthlyInsight key={insight.id} insight={insight} summary={summary} />)}</ul>
        : <Card className="shadow-none"><CardContent><p className="text-sm leading-6 text-content">{summary.partial || summary.future ? "Comparação conclusiva disponível após o encerramento do mês." : !summary.hasHistory ? "Sem registros no mês anterior para explicar mudanças." : "Nenhuma mudança por categoria atingiu os limites de relevância: R$ 100 e 20% quando a base anterior é positiva."}</p></CardContent></Card>}
    </section>
    <ReportEntries report={{ entries: summary.entries }} />
  </div>;
}
