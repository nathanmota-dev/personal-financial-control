"use client";

import { MoneyInput } from "@/components/finance/money-input";
import { Label } from "@/components/ui/label";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { InvestmentReductionDialogSection1Props } from "@/lib/interfaces/render/investment-reduction-dialog-investment-reduction-dialog-section1";
import { cn } from "@/lib/utils";
import { parseInputCents } from "@/lib/utils/components/investment-reduction-dialog";
import { Check,Layers3 } from "lucide-react";

export function InvestmentReductionDialogSection1({ group, amounts, changeAmount }: InvestmentReductionDialogSection1Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<section key={group.label} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Layers3 className="size-4 text-content" />
                  <h3 className="text-xs font-semibold text-content">
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
                            ? "border-brand/30 bg-brand/[0.07]"
                            : "border-border bg-card",
                          exceedsAvailable && "border-danger/40 bg-danger/[0.06]"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-content-strong">{source.label}</p>
                            {selectedSourceCents > 0 && !exceedsAvailable ? (
                              <Check className="size-4 shrink-0 text-brand" />
                            ) : null}
                          </div>
                          <p data-user-content className="mt-1 text-xs leading-5 text-content">{source.description}</p>
                          <p className="mt-1 text-xs text-content">
                            Disponível: {formatCurrency(source.availableCents)}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`reduction-${source.id}`} className="text-xs text-content">
                            Quanto reduzir
                          </Label>
                          <MoneyInput
                            id={`reduction-${source.id}`}
                            inputMode="decimal"
                            value={amounts[source.id] ?? ""}
                            onChange={(event) => changeAmount(source, event.target.value)}
                            placeholder="0,00"
                            aria-invalid={exceedsAvailable}
                            className="h-10 border-input bg-card text-right text-content-strong placeholder:text-content-subtle"
                          />
                          {exceedsAvailable ? (
                            <p className="text-right text-[0.68rem] text-danger">Acima do disponível</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
  );
}
