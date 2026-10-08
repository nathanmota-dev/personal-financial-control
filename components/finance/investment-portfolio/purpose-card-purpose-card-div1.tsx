"use client";

import { Button } from "@/components/ui/button";
import type { PurposeCardDiv1Props } from "@/lib/interfaces/render/purpose-card-purpose-card-div1";
import {
Archive,
Pencil,
Split,
} from "lucide-react";

export function PurposeCardDiv1({ purpose, onAllocate, onEdit, onArchive }: PurposeCardDiv1Props) {
  return (
<div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-1.5 size-2.5 shrink-0 rounded-full shadow-none"
            style={{ backgroundColor: purpose.color, color: purpose.color }}
          />
          <div className="min-w-0">
            <h3 data-user-content className="truncate text-lg font-semibold text-content-strong">
              {purpose.name}
            </h3>
            <p className="mt-0.5 text-xs text-content">
              {purpose.holdingCount}{" "}
              {purpose.holdingCount === 1 ? "ativo relacionado" : "ativos relacionados"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Alocar ativo"
            aria-label={"Alocar ativo em " + purpose.name}
            onClick={onAllocate}
          >
            <Split className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Editar caixinha"
            aria-label={"Editar " + purpose.name}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title={
              purpose.allocatedCents > 0
                ? "Remova o saldo antes de arquivar"
                : "Arquivar caixinha"
            }
            aria-label={"Arquivar " + purpose.name}
            disabled={purpose.allocatedCents > 0}
            onClick={onArchive}
          >
            <Archive className="size-3.5" />
          </Button>
        </div>
      </div>
  );
}
