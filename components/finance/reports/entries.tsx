import { FinanceEmptyState } from "@/components/finance/empty-state";
import { ReportEntriesTable } from "@/components/finance/reports/entries-table";
import { ReportEntryMobile } from "@/components/finance/reports/entry-mobile";
import { Badge } from "@/components/ui/badge";
import { ReportCard } from "@/components/finance/reports/report-card";
import type { ReportEntriesProps } from "@/lib/interfaces/reports";

export function ReportEntries({ report }: ReportEntriesProps) {
  return <ReportCard title="Origens dos totais" badge={<Badge variant="outline" className="border-input text-content">{report.entries.length}</Badge>} description="Todos os lançamentos e parcelas incluídos no período. Consulte a origem para editar ou conferir a fatura." illustrationSrc="/images/transactions-card-cash.webp">
    {report.entries.length ? <>
      <ReportEntriesTable report={report} />
      <div className="grid gap-3 md:hidden">{report.entries.map((entry) => <ReportEntryMobile key={`${entry.source}-${entry.id}`} entry={entry} />)}</div>
    </> : <FinanceEmptyState title="Sem lançamentos ou parcelas" description="Confira a competência selecionada e os registros em Lançamentos e Cartões." />}
  </ReportCard>;
}
