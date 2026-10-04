"use client";

import { FormSelect } from "@/components/finance/form-select";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import {
transactionTypeLabels
} from "@/lib/finance-ui";
import type { TransactionDialogDiv4Props } from "@/lib/interfaces/render/transaction-dialog-transaction-dialog-div4";
import { labelClassName,selectClassName } from "@/lib/utils/components/transaction-dialog";

export function TransactionDialogDiv4({ formId, selectedType, handleTypeChange }: TransactionDialogDiv4Props) {
  return (
<div className="space-y-2">
                  <Label htmlFor={`${formId}-type`} className={labelClassName}>
                    Tipo
                  </Label>
                  <FormSelect
                    id={`${formId}-type`}
                    name="type"
                    value={selectedType}
                    onValueChange={handleTypeChange}
                    className={selectClassName}
                  >
                    {Object.entries(transactionTypeLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </FormSelect>
                </div>
  );
}
