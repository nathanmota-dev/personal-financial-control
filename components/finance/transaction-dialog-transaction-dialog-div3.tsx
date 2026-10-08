"use client";

import { FormSelect } from "@/components/finance/form-select";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import type { TransactionDialogDiv3Props } from "@/lib/interfaces/render/transaction-dialog-transaction-dialog-div3";
import { NO_CATEGORY_VALUE,labelClassName,selectClassName } from "@/lib/utils/components/transaction-dialog";

export function TransactionDialogDiv3({ formId, selectedCategoryId, setSelectedCategoryId, categoryRequired, filteredCategories }: TransactionDialogDiv3Props) {
  return (
<div className="space-y-2">
                  <Label
                    htmlFor={`${formId}-category`}
                    className={labelClassName}
                  >
                    Categoria
                  </Label>
                  <FormSelect
                    id={`${formId}-category`}
                    name="categoryId"
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                    className={selectClassName}
                    required={categoryRequired}
                  >
                    {!categoryRequired ? (
                      <SelectItem value={NO_CATEGORY_VALUE}>
                        Sem categoria
                      </SelectItem>
                    ) : null}
                    {!filteredCategories.length && categoryRequired ? (
                      <SelectItem value={NO_CATEGORY_VALUE}>
                        Nenhuma categoria compatível
                      </SelectItem>
                    ) : null}
                    {filteredCategories.map((category) => (
                      <SelectItem data-user-content key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                  <p className="text-xs text-content">
                    {categoryRequired
                      ? "Obrigatória para movimentações de investimento."
                      : "Opcional; você pode categorizar depois."}
                  </p>
                </div>
  );
}
