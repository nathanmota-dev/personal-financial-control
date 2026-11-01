import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import type { ReportEntrySourceProps } from "@/lib/interfaces/reports";

export function ReportEntrySource({ entry, badgeOnly }: ReportEntrySourceProps) {
  if (badgeOnly) return <StatusDotBadge tone="text-content-muted">{entry.source === "installment" ? "Parcela de cartão" : "Lançamento"}</StatusDotBadge>;
  return <Button asChild variant="outline" size="sm"><Link href={`/${entry.source === "installment" ? "credit-card" : "transactions"}?month=${entry.month}`}>
    {entry.source === "installment" ? "Parcela de cartão" : "Lançamento"}<ArrowUpRight aria-hidden="true" />
  </Link></Button>;
}
