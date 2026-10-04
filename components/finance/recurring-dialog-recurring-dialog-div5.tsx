"use client";

import { MoneyInput } from "@/components/finance/money-input";
import { Label } from "@/components/ui/label";
import {
centsToMoneyInput,
formatMoneyInput
} from "@/lib/finance-ui";
import type { RecurringDialogDiv5Props } from "@/lib/interfaces/render/recurring-dialog-recurring-dialog-div5";
import { cn } from "@/lib/utils";
import { recurringFieldClassName,recurringFieldLabelClassName } from "@/lib/utils/components/recurring-dialog";

export function RecurringDialogDiv5({ formId, template }: RecurringDialogDiv5Props) {
  return (
<div className="space-y-2">
                <Label
                  htmlFor={`${formId}-amount`}
                  className={recurringFieldLabelClassName}
                >
                  Valor da recorrência
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-content">
                    R$
                  </span>
                  <MoneyInput
                    id={`${formId}-amount`}
                    name="amount"
                    inputMode="decimal"
                    required
                    defaultValue={
                      template
                        ? formatMoneyInput(
                            centsToMoneyInput(template.amountCents),
                          )
                        : ""
                    }

                    placeholder="120,00"
                    className={cn(
                      recurringFieldClassName,
                      "pl-12 text-right tabular-nums",
                    )}
                  />
                </div>
              </div>
  );
}
