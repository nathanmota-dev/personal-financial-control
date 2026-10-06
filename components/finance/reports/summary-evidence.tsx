import { SummaryEntry } from "@/components/finance/reports/summary-entry";
import type { SummaryEvidenceProps } from "@/lib/interfaces/monthly-retrospective";

export function SummaryEvidence({ label, entries }: SummaryEvidenceProps) {
  return <section aria-label={label} className="min-w-0 space-y-3 border-t border-border pt-4">
    <h4 className="text-xs font-medium text-content">{label}</h4>
    {entries.length ? <ul className="divide-y divide-border">{entries.map((entry) => <SummaryEntry key={`${entry.source}-${entry.id}`} entry={entry} />)}</ul>
      : <p className="text-xs leading-5 text-content">Sem registros de despesa nesta categoria no período.</p>}
  </section>;
}
