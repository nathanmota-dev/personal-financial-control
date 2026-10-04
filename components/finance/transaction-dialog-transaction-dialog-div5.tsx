"use client";

import { MoneyInput } from "@/components/finance/money-input";
import { Label } from "@/components/ui/label";
import {
centsToMoneyInput
} from "@/lib/finance-ui";
import type { TransactionDialogDiv5Props } from "@/lib/interfaces/render/transaction-dialog-transaction-dialog-div5";
import { cn } from "@/lib/utils";
import { fieldClassName,labelClassName } from "@/lib/utils/components/transaction-dialog";

export function TransactionDialogDiv5({ formId, transaction }: TransactionDialogDiv5Props) {
  return (
<div className="space-y-2">
                  <Label
                    htmlFor={`${formId}-amount`}
                    className={labelClassName}
                  >
                    Valor
                  </Label>
                  <MoneyInput
                    id={`${formId}-amount`}
                    name="amount"
                    inputMode="decimal"
                    defaultValue={
                      transaction
                        ? centsToMoneyInput(transaction.amountCents)
                        : ""
                    }
                    placeholder="0,00"
                    className={cn(fieldClassName, "tabular-nums")}
                    required
                  />
                </div>
  );
}
