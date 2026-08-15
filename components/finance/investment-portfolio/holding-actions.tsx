"use client";

import { Archive, Pencil, Split } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HoldingActionsProps } from "@/lib/interfaces/investment-portfolio";

export function HoldingActions({
  holding,
  onEdit,
  onAllocate,
  onArchive,
}: HoldingActionsProps) {
  const canArchive = holding.currentValueCents === 0 && holding.allocationCount === 0;

  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title="Alocar em caixinha"
        aria-label={"Alocar " + holding.name}
        onClick={onAllocate}
      >
        <Split className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title="Editar ativo"
        aria-label={"Editar " + holding.name}
        onClick={onEdit}
      >
        <Pencil className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        title={canArchive ? "Arquivar ativo" : "Zere o ativo e remova as alocações para arquivar"}
        aria-label={"Arquivar " + holding.name}
        disabled={!canArchive}
        onClick={onArchive}
      >
        <Archive className="size-3.5" />
      </Button>
    </div>
  );
}
