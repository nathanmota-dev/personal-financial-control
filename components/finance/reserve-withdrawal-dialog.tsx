"use client";

import { ArrowDownToLine } from "lucide-react";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { ReserveWithdrawalRow } from "@/components/finance/reserve-withdrawal-row";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReserveWithdrawalDialogProps } from "@/lib/interfaces/components/reserve-withdrawal";

export function ReserveWithdrawalDialog({ withdrawals, open, onOpenChange }: ReserveWithdrawalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-content-strong sm:max-w-xl">
        <DialogHeader icon={<ArrowDownToLine />} tone="warning">
          <DialogTitle>De onde saiu cada retirada?</DialogTitle>
          <DialogDescription className="leading-6 text-content">
            A reserva e a carteira tinham dinheiro, então o banco não diz de qual parte a retirada saiu. Reserva desconta o valor da reserva; carteira mantém a reserva como está. O saldo da conta não muda.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-[260px] divide-y divide-border overflow-y-auto">
          {withdrawals.map((withdrawal) => <ReserveWithdrawalRow key={withdrawal.id} withdrawal={withdrawal} />)}
        </ul>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
