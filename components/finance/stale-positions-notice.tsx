"use client";

import { Clock } from "lucide-react";
import { useState } from "react";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { StalePositionsDialog } from "@/components/finance/stale-positions-dialog";
import { Button } from "@/components/ui/button";
import type { StalePositionsNoticeProps } from "@/lib/interfaces/components/stale-positions";
import { STALE_POSITION_DAYS } from "@/lib/stale-positions";

export function StalePositionsNotice({ positions }: StalePositionsNoticeProps) {
  const { formatCurrency } = useFinancialFormatter();
  const [open, setOpen] = useState(false);
  if (!positions.length) return null;
  const totalCents = positions.reduce((total, position) => total + position.currentValueCents, 0);
  const count = positions.length === 1 ? "1 posição sem atualização" : `${positions.length} posições sem atualização`;

  return (
    <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/25 bg-warning/10 px-3 py-2.5 text-xs">
      <p className="flex min-w-0 items-center gap-1.5 text-content">
        <Clock aria-hidden className="size-3.5 shrink-0 text-warning" />
        <span><span className="font-semibold text-content-strong">{count} do banco há mais de {STALE_POSITION_DAYS} dias.</span> Somam {formatCurrency(totalCents)} no total investido.</span>
      </p>
      <Button type="button" variant="outline" size="sm" className="h-auto rounded-lg px-3 py-1.5 text-xs font-semibold" onClick={() => setOpen(true)}>
        Revisar posições
      </Button>
      {open ? <StalePositionsDialog positions={positions} open={open} onOpenChange={setOpen} /> : null}
    </div>
  );
}
