import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportEntryProps } from "@/lib/interfaces/reports";

export function ReportEntrySource({ entry }: ReportEntryProps) {
  return <Button asChild variant="outline" size="sm"><Link href={`/${entry.source === "installment" ? "credit-card" : "transactions"}?month=${entry.month}`}>
    {entry.source === "installment" ? "Parcela de cartão" : "Lançamento"}<ArrowUpRight aria-hidden="true" />
  </Link></Button>;
}
