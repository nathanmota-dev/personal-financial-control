"use client";

import { Label } from "@/components/ui/label";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import type { RecurringDialogDiv1Props } from "@/lib/interfaces/render/recurring-dialog-recurring-dialog-div1";
import { recurringFieldLabelClassName,recurringSelectContentClassName,recurringSelectItemClassName,recurringSelectTriggerClassName } from "@/lib/utils/components/recurring-dialog";

export function RecurringDialogDiv1({ formId, selectedType, handleTypeChange }: RecurringDialogDiv1Props) {
  return (
<div className="space-y-2">
                <Label
                  htmlFor={`${formId}-type`}
                  className={recurringFieldLabelClassName}
                >
                  Tipo de recorrência
                </Label>
                <Select
                  name="type"
                  value={selectedType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger
                    id={`${formId}-type`}
                    className={recurringSelectTriggerClassName}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className={recurringSelectContentClassName}>
                    <SelectItem
                      value="income"
                      className={recurringSelectItemClassName}
                    >
                      Receita
                    </SelectItem>
                    <SelectItem
                      value="expense"
                      className={recurringSelectItemClassName}
                    >
                      Despesa
                    </SelectItem>
                    <SelectItem
                      value="investment_contribution"
                      className={recurringSelectItemClassName}
                    >
                      Aporte
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
  );
}
