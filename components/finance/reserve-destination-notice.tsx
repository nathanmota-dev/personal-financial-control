"use client";

import { ArrowUpFromLine, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { ReserveDestinationDialog } from "@/components/finance/reserve-destination-dialog";
import { Button } from "@/components/ui/button";
import type { ReserveDestinationNoticeProps } from "@/lib/interfaces/components/reserve-destination";
import { cn } from "@/lib/utils";

export function ReserveDestinationNotice({ contributions, className }: ReserveDestinationNoticeProps) {
  const [open, setOpen] = useState(false);
  if (!contributions.length) return null;
  const pending = contributions.filter((contribution) => contribution.pending).length;
  const count = pending === 1 ? "1 aporte para classificar" : `${pending} aportes para classificar`;

  return (
    <div role="status" className={cn("mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs", pending ? "border-warning/25 bg-warning/10" : "border-border bg-surface", className)}>
      <p className="flex min-w-0 items-center gap-1.5 text-content">
        {pending ? <TriangleAlert aria-hidden className="size-3.5 shrink-0 text-warning" /> : <ArrowUpFromLine aria-hidden className="size-3.5 shrink-0 text-content-subtle" />}
        {pending
          ? <span><span className="font-semibold text-content-strong">{count}.</span> Diga quanto de cada um foi para a reserva.</span>
          : <span>Aportes desde que você definiu a reserva, com o destino de cada um.</span>}
      </p>
      <Button type="button" variant="outline" size="sm" className="h-auto rounded-lg px-3 py-1.5 text-xs font-semibold" onClick={() => setOpen(true)}>
        {pending ? "Classificar aportes" : "Revisar aportes"}
      </Button>
      {open ? <ReserveDestinationDialog contributions={contributions} open={open} onOpenChange={setOpen} /> : null}
    </div>
  );
}
