"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { BankReserveDialog } from "@/components/finance/bank-reserve-dialog";
import { Button } from "@/components/ui/button";
import type { BankReserveControlProps } from "@/lib/interfaces/components/bank-reserve";

export function BankReserveControl({ split }: BankReserveControlProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" className="h-auto gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" onClick={() => setOpen(true)}>
        <SlidersHorizontal aria-hidden className="size-3.5" />
        {split.configuredReserveCents === null ? "Definir reserva" : "Ajustar reserva"}
      </Button>
      {open ? <BankReserveDialog split={split} open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
