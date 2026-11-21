"use client";

import { ArrowDownToLine } from "lucide-react";

import { ReserveClassificationDialog } from "@/components/finance/reserve-classification-dialog";
import { ReserveWithdrawalRow } from "@/components/finance/reserve-withdrawal-row";
import type { ReserveWithdrawalDialogProps } from "@/lib/interfaces/components/reserve-withdrawal";

export function ReserveWithdrawalDialog({ withdrawals, open, onOpenChange }: ReserveWithdrawalDialogProps) {
  return (
    <ReserveClassificationDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<ArrowDownToLine />}
      tone="warning"
      title="De onde saiu cada retirada?"
      description="A reserva e a carteira tinham dinheiro, então o banco não diz de qual parte a retirada saiu. Reserva desconta o valor da reserva; carteira mantém a reserva como está. O saldo da conta não muda."
    >
      {withdrawals.map((withdrawal) => <ReserveWithdrawalRow key={withdrawal.id} withdrawal={withdrawal} />)}
    </ReserveClassificationDialog>
  );
}
