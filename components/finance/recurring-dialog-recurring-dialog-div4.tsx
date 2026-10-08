"use client";

import { Label } from "@/components/ui/label";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import type { RecurringDialogDiv4Props } from "@/lib/interfaces/render/recurring-dialog-recurring-dialog-div4";
import { recurringFieldLabelClassName,recurringSelectContentClassName,recurringSelectItemClassName,recurringSelectTriggerClassName } from "@/lib/utils/components/recurring-dialog";

export function RecurringDialogDiv4({ formId, selectedCategoryId, setSelectedCategoryId, filteredCategories, selectedType }: RecurringDialogDiv4Props) {
  return (
<div className="space-y-2">
                <Label
                  htmlFor={`${formId}-category`}
                  className={recurringFieldLabelClassName}
                >
                  Categoria
                </Label>
                <Select
                  name="categoryId"
                  value={selectedCategoryId || undefined}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger
                    id={`${formId}-category`}
                    className={recurringSelectTriggerClassName}
                  >
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className={recurringSelectContentClassName}>
                    {filteredCategories.map((category) => (
                      <SelectItem data-user-content
                        key={category.id}
                        value={category.id}
                        className={recurringSelectItemClassName}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-content">
                  {selectedType === "income"
                    ? "Receitas começam em Salário."
                    : selectedType === "investment_contribution"
                      ? "Aportes começam em Investimentos."
                      : "Despesas começam em Outros."}
                </p>
              </div>
  );
}
