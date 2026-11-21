"use client";

import { ArrowUpFromLine } from "lucide-react";
import { useState } from "react";

import { ReserveDestinationDialog } from "@/components/finance/reserve-destination-dialog";
import { Button } from "@/components/ui/button";
import type { TransactionDestinationButtonProps } from "@/lib/interfaces/components/reserve-destination";
import { pendingDestinationOf } from "@/lib/utils/components/reserve-destination";

/** Opens the reserve destination of a bank contribution from the transaction list, where people look first. */
export function TransactionDestinationButton({ transaction }: TransactionDestinationButtonProps) {
  const [open, setOpen] = useState(false);
  const contribution = pendingDestinationOf(transaction);
  if (!contribution) return null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="h-6 gap-1 rounded-full border-warning/35 bg-warning/10 px-2 text-[11px] font-semibold text-content-strong" onClick={() => setOpen(true)}>
        <ArrowUpFromLine aria-hidden className="size-3 text-warning" />
        Definir destino
      </Button>
      {open ? <ReserveDestinationDialog contributions={[contribution]} open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
