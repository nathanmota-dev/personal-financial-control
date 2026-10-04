"use client";

import type { TransactionDialogFieldset1Props } from "@/lib/interfaces/render/transaction-dialog-transaction-dialog-fieldset1";
import { cn } from "@/lib/utils";
import { labelClassName } from "@/lib/utils/components/transaction-dialog";

export function TransactionDialogFieldset1({ fundingSource, setFundingSource }: TransactionDialogFieldset1Props) {
  return (
<fieldset className="space-y-2 md:col-span-2">
                    <legend className={labelClassName}>
                      Origem da despesa
                    </legend>
                    <div
                      className="grid gap-3 sm:grid-cols-2"
                      role="radiogroup"
                      aria-label="Origem da despesa"
                    >
                      <label
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-2xl border p-3 transition-colors",
                          fundingSource === "account"
                            ? "border-brand/35 bg-brand/[0.08]"
                            : "border-border bg-card hover:border-input",
                        )}
                      >
                        <input
                          type="radio"
                          name="fundingSource"
                          value="account"
                          checked={fundingSource === "account"}
                          onChange={() => setFundingSource("account")}
                          className="mt-1 accent-brand"
                        />
                        <span>
                          <span className="block text-sm font-medium text-content-strong">
                            Saldo em conta
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-content">
                            A despesa reduz diretamente o saldo líquido da
                            conta.
                          </span>
                        </span>
                      </label>
                      <label
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-2xl border p-3 transition-colors",
                          fundingSource === "investments"
                            ? "border-warning/35 bg-warning/[0.08]"
                            : "border-border bg-card hover:border-input",
                        )}
                      >
                        <input
                          type="radio"
                          name="fundingSource"
                          value="investments"
                          checked={fundingSource === "investments"}
                          onChange={() => setFundingSource("investments")}
                          className="mt-1 accent-warning"
                        />
                        <span>
                          <span className="block text-sm font-medium text-content-strong">
                            Investimentos
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-content">
                            Cria um resgate automático e registra de quais
                            ativos ele saiu.
                          </span>
                        </span>
                      </label>
                    </div>
                  </fieldset>
  );
}
