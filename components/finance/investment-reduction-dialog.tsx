"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { buildInitialAmounts,groupSources,parseInputCents } from "@/lib/utils/components/investment-reduction-dialog";
import { InvestmentReductionDialogDiv2 } from "./investment-reduction-dialog-investment-reduction-dialog-div2";

import { ArrowDownRight } from "lucide-react";
import { useMemo,useState } from "react";

import { Button } from "@/components/ui/button";
import {
Dialog,

DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog";
import type {
InvestmentReductionDialogProps,
InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";

export function InvestmentReductionDialog({
  open,
  title,
  description,
  amountCents,
  sources,
  initialSelections = [],
  isPending = false,
  onOpenChange,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmar redução",
  footerNote,
}: InvestmentReductionDialogProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    buildInitialAmounts(initialSelections)
  );

  const parsedSelections = useMemo(
    () =>
      sources
        .map((source) => ({
          sourceId: source.id,
          amountCents: parseInputCents(amounts[source.id] ?? ""),
        }))
        .filter((selection) => selection.amountCents > 0),
    [amounts, sources]
  );
  const selectedCents = parsedSelections.reduce(
    (total, selection) => total + selection.amountCents,
    0
  );
  const remainingCents = amountCents - selectedCents;
  const isClosed = remainingCents === 0;
  const groupedSources = useMemo(() => groupSources(sources), [sources]);

  function changeAmount(source: InvestmentReductionSource, value: string) {
    setAmounts((current) => ({ ...current, [source.id]: value }));
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      onCancel?.();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(92vh,760px)] overflow-hidden border-brand/15 bg-card text-content-strong shadow-none sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
              <ArrowDownRight className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl tracking-tight text-content-strong">{title}</DialogTitle>
              <DialogDescription className="mt-2 leading-6 text-content">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <InvestmentReductionDialogDiv2 amountCents={amountCents} selectedCents={selectedCents} groupedSources={groupedSources} amounts={amounts} changeAmount={changeAmount} isClosed={isClosed} remainingCents={remainingCents} footerNote={footerNote} />

        <DialogFooter className="border-t border-border/80 pt-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(parsedSelections)}
            disabled={isPending || !isClosed || parsedSelections.some((selection) => {
              const source = sources.find((item) => item.id === selection.sourceId);
              return !source || selection.amountCents > source.availableCents;
            })}
          >
            {isPending ? "Salvando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
