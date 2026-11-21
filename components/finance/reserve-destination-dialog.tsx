"use client";

import { ArrowUpFromLine } from "lucide-react";

import { ReserveClassificationDialog } from "@/components/finance/reserve-classification-dialog";
import { ReserveDestinationRow } from "@/components/finance/reserve-destination-row";
import type { ReserveDestinationDialogProps } from "@/lib/interfaces/components/reserve-destination";

export function ReserveDestinationDialog({ contributions, open, onOpenChange }: ReserveDestinationDialogProps) {
  return (
    <ReserveClassificationDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<ArrowUpFromLine />}
      tone="brand"
      title="Para onde foi cada aporte?"
      description="O banco informa quanto foi aplicado, mas não quanto é reserva. Diga a parte de cada aporte que foi para a reserva; o restante fica em investimentos. O saldo da conta não muda."
      listClassName="max-h-[360px]"
    >
      {contributions.map((contribution) => <ReserveDestinationRow key={contribution.id} contribution={contribution} />)}
    </ReserveClassificationDialog>
  );
}
