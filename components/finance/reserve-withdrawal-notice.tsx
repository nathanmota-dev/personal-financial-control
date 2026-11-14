"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";

import { ReserveWithdrawalDialog } from "@/components/finance/reserve-withdrawal-dialog";
import { Button } from "@/components/ui/button";
import type { ReserveWithdrawalNoticeProps } from "@/lib/interfaces/components/reserve-withdrawal";

export function ReserveWithdrawalNotice({ withdrawals }: ReserveWithdrawalNoticeProps) {
  const [open, setOpen] = useState(false);
  if (!withdrawals.length) return null;
  const count = withdrawals.length === 1 ? "1 retirada para classificar" : `${withdrawals.length} retiradas para classificar`;

  return (
    <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/25 bg-warning/10 px-3 py-2.5 text-xs">
      <p className="flex min-w-0 items-center gap-1.5 text-content">
        <TriangleAlert aria-hidden className="size-3.5 shrink-0 text-warning" />
        <span><span className="font-semibold text-content-strong">{count}.</span> Diga se cada uma saiu da reserva ou da carteira.</span>
      </p>
      <Button type="button" variant="outline" size="sm" className="h-auto rounded-lg px-3 py-1.5 text-xs font-semibold" onClick={() => setOpen(true)}>
        Classificar
      </Button>
      {open ? <ReserveWithdrawalDialog withdrawals={withdrawals} open={open} onOpenChange={setOpen} /> : null}
    </div>
  );
}
