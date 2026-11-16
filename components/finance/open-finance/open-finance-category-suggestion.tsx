"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { OpenFinanceCategorySuggestionProps } from "@/lib/interfaces/components/open-finance";

/** Nothing is applied until the user accepts: the suggestion only becomes a rule through the normal flow. */
export function OpenFinanceCategorySuggestion({ categoryName, reason, disabled, onAccept }: OpenFinanceCategorySuggestionProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/10 p-2.5">
      <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-content-strong">
          Sugestão da IA: <span data-user-content className="font-semibold">{categoryName}</span>
        </p>
        {reason ? <p data-user-content className="text-xs text-content-muted">{reason}</p> : null}
      </div>
      <Button type="button" size="sm" disabled={disabled} onClick={onAccept} aria-label={`Aceitar sugestão ${categoryName}`}>
        Aceitar
      </Button>
    </div>
  );
}
