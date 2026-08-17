"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, Check, CircleDollarSign, Layers3, ShieldAlert } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  InvestmentReductionDialogProps,
  InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";
import { centsToMoneyInput, formatCurrency, moneyInputToCents } from "@/lib/finance-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <DialogContent className="max-h-[min(92vh,760px)] overflow-hidden border-cyan-400/15 bg-slate-950 text-slate-100 shadow-[0_30px_100px_rgba(2,6,23,0.72)] sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <ArrowDownRight className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl tracking-tight text-slate-50">{title}</DialogTitle>
              <DialogDescription className="mt-2 leading-6 text-slate-400">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 gap-4 overflow-y-auto pr-1">
          <div className="grid gap-3 rounded-[1.4rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_55%),rgba(15,23,42,0.72)] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                Redução a distribuir
              </p>
              <p className="mt-1 font-heading text-3xl font-semibold tracking-tight text-cyan-200">
                {formatCurrency(amountCents)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-right">
              <p className="text-xs text-slate-500">Selecionado</p>
              <p className="mt-1 font-semibold text-slate-100">{formatCurrency(selectedCents)}</p>
            </div>
          </div>

          {groupedSources.length ? (
            groupedSources.map((group) => (
              <section key={group.label} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Layers3 className="size-4 text-slate-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {group.label}
                  </h3>
                </div>
                <div className="grid gap-2">
                  {group.sources.map((source) => {
                    const selectedSourceCents = parseInputCents(amounts[source.id] ?? "");
                    const exceedsAvailable = selectedSourceCents > source.availableCents;

                    return (
                      <div
                        key={source.id}
                        className={cn(
                          "grid gap-3 rounded-2xl border px-3 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center",
                          selectedSourceCents > 0 && !exceedsAvailable
                            ? "border-cyan-300/30 bg-cyan-300/[0.07]"
                            : "border-slate-800 bg-slate-900/50",
                          exceedsAvailable && "border-rose-400/40 bg-rose-400/[0.06]"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-slate-100">{source.label}</p>
                            {selectedSourceCents > 0 && !exceedsAvailable ? (
                              <Check className="size-4 shrink-0 text-cyan-300" />
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{source.description}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Disponível: {formatCurrency(source.availableCents)}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`reduction-${source.id}`} className="text-xs text-slate-400">
                            Quanto reduzir
                          </Label>
                          <Input
                            id={`reduction-${source.id}`}
                            inputMode="decimal"
                            value={amounts[source.id] ?? ""}
                            onChange={(event) => changeAmount(source, event.target.value)}
                            placeholder="0,00"
                            aria-invalid={exceedsAvailable}
                            className="h-10 border-slate-700 bg-slate-950/80 text-right text-slate-100 placeholder:text-slate-600"
                          />
                          {exceedsAvailable ? (
                            <p className="text-right text-[0.68rem] text-rose-300">Acima do disponível</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm leading-6 text-amber-100">
              Não há uma fonte cadastrada para esta redução. Atualize o patrimônio ou escolha o
              patrimônio não cadastrado quando essa opção estiver disponível.
            </div>
          )}

          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
              isClosed
                ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100"
                : remainingCents > 0
                  ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-100"
                  : "border-rose-300/20 bg-rose-300/[0.06] text-rose-100"
            )}
          >
            {isClosed ? (
              <CircleDollarSign className="mt-0.5 size-4 shrink-0 text-emerald-300" />
            ) : (
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
            )}
            <div>
              <p className="font-medium">
                {isClosed
                  ? "A distribuição fecha exatamente a redução."
                  : remainingCents > 0
                    ? `Ainda faltam ${formatCurrency(remainingCents)}.`
                    : `A distribuição excede em ${formatCurrency(Math.abs(remainingCents))}.`}
              </p>
              {footerNote ? <div className="mt-1 text-xs opacity-75">{footerNote}</div> : null}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-800/80 pt-4">
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

type SourceGroup = {
  label: string;
  sources: InvestmentReductionSource[];
};

function groupSources(sources: InvestmentReductionSource[]): SourceGroup[] {
  const groups = new Map<string, InvestmentReductionSource[]>();

  for (const source of sources) {
    const label = source.sourceType === "not_registered" ? "Fora da carteira cadastrada" : source.holdingName ?? "Ativos";
    const current = groups.get(label) ?? [];
    current.push(source);
    groups.set(label, current);
  }

  return [...groups.entries()].map(([label, groupedSources]) => ({
    label,
    sources: groupedSources,
  }));
}

function parseInputCents(value: string) {
  if (!value.trim()) {
    return 0;
  }

  try {
    return Math.max(moneyInputToCents(value), 0);
  } catch {
    return 0;
  }
}

function buildInitialAmounts(
  selections: InvestmentReductionDialogProps["initialSelections"]
) {
  const amounts: Record<string, string> = {};

  for (const selection of selections ?? []) {
    amounts[selection.sourceId] = centsToMoneyInput(selection.amountCents);
  }

  return amounts;
}
