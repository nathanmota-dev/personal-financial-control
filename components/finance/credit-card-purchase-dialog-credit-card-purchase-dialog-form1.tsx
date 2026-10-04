"use client";

import { FinanceField } from "@/components/finance/finance-field";
import { FormSelect } from "@/components/finance/form-select";
import { MoneyInput } from "@/components/finance/money-input";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CreditCardPurchaseDialogForm1Props } from "@/lib/interfaces/render/credit-card-purchase-dialog-credit-card-purchase-dialog-form1";
import { centsToInputValue } from "@/lib/utils/components/credit-card-purchase-dialog";

export function CreditCardPurchaseDialogForm1({ startTransition, onSubmit, defaultCategoryId, categories, purchaseDateFieldId, purchaseDate, setPurchaseDate, charge, isPending, isEditing }: CreditCardPurchaseDialogForm1Props) {
  return (
<form
            action={(formData) =>
              startTransition(() => void onSubmit(formData))
            }
            className="grid gap-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FinanceField label="Categoria">
                <FormSelect name="categoryId" defaultValue={defaultCategoryId}>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </FormSelect>
              </FinanceField>
              <div className="grid gap-2">
                <Label
                  htmlFor={purchaseDateFieldId}
                  className="text-xs font-medium text-content"
                >
                  Data da compra
                </Label>
                <DatePickerField
                  id={purchaseDateFieldId}
                  name="purchaseDate"
                  value={purchaseDate}
                  required
                  onDateChange={(nextDate) => {
                    if (nextDate) setPurchaseDate(nextDate);
                  }}
                />
              </div>
              <FinanceField label="Valor total (R$)">
                <MoneyInput
                  name="amount"
                  placeholder="0,00"
                  defaultValue={
                    charge ? centsToInputValue(charge.totalAmountCents) : ""
                  }
                />
              </FinanceField>
              <FinanceField label="Parcelas">
                <Input
                  name="installmentCount"
                  type="number"
                  min="1"
                  max="60"
                  defaultValue={String(charge?.installmentCount ?? 1)}
                  placeholder="Quantidade de parcelas"
                />
              </FinanceField>
              <FinanceField
                label="Descrição da compra"
                className="md:col-span-2"
              >
                <Input
                  name="description"

                  placeholder="Descrição da compra"
                  defaultValue={charge?.description ?? ""}
                />
              </FinanceField>
            </div>
            <FinanceField label="Observações">
              <Textarea
                name="notes"
                defaultValue={charge?.notes ?? ""}
                placeholder="Observações"
              />
            </FinanceField>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar alterações"
                    : "Criar compra"}
              </Button>
            </DialogFooter>
          </form>
  );
}
