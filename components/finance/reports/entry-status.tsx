import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { Badge } from "@/components/ui/badge";
import type { ReportEntryProps } from "@/lib/interfaces/reports";

export function ReportEntryStatus({ entry }: ReportEntryProps) {
  if (entry.source === "installment" && entry.status !== "pending") {
    return <Badge variant="outline" className="border-input text-[0.68rem] text-content">Parcela por competência</Badge>;
  }
  return <StatusDotBadge tone={entry.status === "pending" ? "text-warning" : "text-success"}>
    {entry.status === "pending" ? "Pendente" : "Efetivado"}
  </StatusDotBadge>;
}
