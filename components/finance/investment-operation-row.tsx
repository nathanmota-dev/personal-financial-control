"use client";

import { IconTile } from "@/components/finance/ds/icon-tile";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/finance-ui";
import type { Tone } from "@/lib/interfaces/design-system";
import type { InvestmentOperationRowProps } from "@/lib/interfaces/investment-operations";
import { ArrowDownLeft, ArrowUpRight, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";

const presentation: Record<string, { tone: Tone; icon: typeof Pencil }> = {
  buy: { tone: "success", icon: ArrowDownLeft },
  application: { tone: "success", icon: ArrowDownLeft },
  sell: { tone: "warning", icon: ArrowUpRight },
  redemption: { tone: "warning", icon: ArrowUpRight },
  correction: { tone: "neutral", icon: SlidersHorizontal },
};

export function InvestmentOperationRow({ item, label, onEdit, onRemove }: InvestmentOperationRowProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  const { tone, icon: Icon } = presentation[item.type] ?? presentation.correction;
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-muted/50 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,.7fr)_minmax(0,.7fr)_auto]">
      <IconTile tone={tone}><Icon /></IconTile>
      <div className="min-w-0">
        <p className="font-medium text-content-strong">{label}</p>
        <p className="mt-0.5 truncate text-xs text-content-muted">{formatDateLabel(item.operatedOn)}{item.notes ? ` · ${item.notes}` : ""}</p>
      </div>
      <div className="flex justify-end gap-1 md:order-5">
        <Button size="icon-sm" variant="ghost" aria-label="Editar esta operação" onClick={onEdit}><Pencil className="size-4" /></Button>
        <Button size="icon-sm" variant="ghost" aria-label="Excluir esta operação" className="text-content hover:bg-danger-soft hover:text-danger" onClick={onRemove}><Trash2 className="size-4" /></Button>
      </div>
      <p className="col-start-2 text-sm tabular-nums md:col-start-auto">{protect(item.quantityUnits ? `${item.quantityUnits / 100_000_000} un.` : "—")}</p>
      <p className="col-start-2 text-sm font-semibold tabular-nums md:col-start-auto">{formatCurrency(item.grossAmountCents)}</p>
    </div>
  );
}
