"use client";

import { Clock } from "lucide-react";

import { ReserveClassificationDialog } from "@/components/finance/reserve-classification-dialog";
import { StalePositionRow } from "@/components/finance/stale-position-row";
import type { StalePositionsDialogProps } from "@/lib/interfaces/components/stale-positions";
import { STALE_POSITION_DAYS } from "@/lib/stale-positions";

export function StalePositionsDialog({ positions, open, onOpenChange }: StalePositionsDialogProps) {
  return (
    <ReserveClassificationDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<Clock />}
      tone="warning"
      title="Posições paradas no banco"
      description={`O banco ainda informa estas posições, mas não atualiza o valor há mais de ${STALE_POSITION_DAYS} dias. Normalmente são aplicações já resgatadas. Dar baixa zera e arquiva o ativo e remove as alocações dele. Nenhum lançamento é criado, porque o resgate já entrou na conta quando aconteceu.`}
    >
      {positions.map((position) => <StalePositionRow key={position.id} position={position} />)}
    </ReserveClassificationDialog>
  );
}
