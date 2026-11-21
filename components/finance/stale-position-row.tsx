"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/finance-ui";
import type { StalePositionRowProps } from "@/lib/interfaces/components/stale-positions";
import { StalePositionSubmit } from "@/lib/utils/component-actions/stale-position-submit";

export function StalePositionRow({ position }: StalePositionRowProps) {
  const router = useRouter();
  const { formatCurrency } = useFinancialFormatter();
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px]">
      <div className="min-w-0">
        <p data-user-content className="truncate font-medium text-content-strong">{position.name}</p>
        <p className="mt-0.5 text-[11px] text-content-subtle">Última atualização do banco em {formatDateLabel(position.valueAsOf)}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-content-strong">{formatCurrency(position.currentValueCents)}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-lg text-xs"
          aria-label={`Dar baixa em ${position.name} de ${formatDateLabel(position.valueAsOf)}`}
          disabled={isPending}
          onClick={() => startTransition(() => void StalePositionSubmit({ holdingId: position.id, router }))}
        >
          {isPending ? "Dando baixa..." : "Dar baixa"}
        </Button>
      </div>
    </li>
  );
}
