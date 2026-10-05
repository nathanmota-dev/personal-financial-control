import { FinanceEmptyState } from "@/components/finance/empty-state";
import { ReportEntriesTable } from "@/components/finance/reports/entries-table";
import { ReportEntryMobile } from "@/components/finance/reports/entry-mobile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportEntriesProps } from "@/lib/interfaces/reports";

export function ReportEntries({ report }: ReportEntriesProps) {
  return <Card className="min-w-0 shadow-none">
    <CardHeader><CardTitle className="flex items-center gap-3"><h2>Origens dos totais</h2><Badge variant="outline">{report.entries.length}</Badge></CardTitle><CardDescription>Todos os lançamentos e parcelas incluídos no período. Consulte a origem para editar ou conferir a fatura.</CardDescription></CardHeader>
    <CardContent>{report.entries.length ? <>
      <ReportEntriesTable report={report} />
      <div className="grid gap-3 md:hidden">{report.entries.map((entry) => <ReportEntryMobile key={`${entry.source}-${entry.id}`} entry={entry} />)}</div>
    </> : <FinanceEmptyState title="Sem lançamentos ou parcelas" description="Confira a competência selecionada e os registros em Lançamentos e Cartão." />}</CardContent>
  </Card>;
}
