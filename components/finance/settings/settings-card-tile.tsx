"use client";

import { Pencil } from "lucide-react";

import { ArchiveAccountButton } from "@/components/finance/archive-account-button";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { Button } from "@/components/ui/button";
import type { SettingsCardTileProps } from "@/lib/interfaces/settings";
import { buildCardPreview, parseCardName } from "@/lib/settings-cards";
import { cn } from "@/lib/utils";

import { SettingsCardPreview } from "./settings-card-preview";

export function SettingsCardTile({ card, editing, onEdit }: SettingsCardTileProps) {
  const { brand, product } = parseCardName(card.name);
  return (
    <li aria-label={card.name} className={cn("min-w-0 rounded-[14px] border p-3 transition-colors", editing ? "border-primary bg-primary/5" : "border-border", card.isArchived && "opacity-70")}>
      <SettingsCardPreview card={buildCardPreview(card.id, brand, product)} closingDay={card.creditClosingDay ? String(card.creditClosingDay) : ""} dueDay={String(card.creditDueDay)} />
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p data-user-content className="truncate text-[13px] font-semibold text-content-strong">{card.name}</p>
          {card.isArchived ? <ToneChip tone="neutral" className="mt-1 h-5 px-1.5 text-[11px]">Arquivada</ToneChip> : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Editar" title="Editar" onClick={onEdit}><Pencil className="size-4" /></Button>
          {!card.isArchived ? <ArchiveAccountButton id={card.id} /> : null}
        </div>
      </div>
    </li>
  );
}
