import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import type { ReportEntryProps } from "@/lib/interfaces/reports";

export function ReportEntryStatus({ entry }: ReportEntryProps) {
  return <StatusDotBadge tone={entry.status === "pending" ? "text-warning" : entry.source === "installment" ? "text-brand" : "text-success"}>
    {entry.status === "pending" ? "Pendente" : entry.source === "installment" ? "Parcela por competência" : "Efetivado"}
  </StatusDotBadge>;
}
