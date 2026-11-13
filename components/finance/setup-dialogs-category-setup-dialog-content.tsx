"use client";

import { Tags } from "lucide-react";

import { FinanceField } from "@/components/finance/finance-field";
import { FormSelect } from "@/components/finance/form-select";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import { CATEGORY_CATALOG } from "@/lib/category-catalog";
import { categoryGroupLabels } from "@/lib/finance-ui";
import type { CategoryRow } from "@/lib/interfaces/finance-fields";
import type { CategorySetupDialogContentProps } from "@/lib/interfaces/render/setup-dialogs-account-setup-dialog-dialog-content1";

export function CategorySetupDialogContent({ category, isPending, selectedGroup, onGroupChange, onNameChange, onSubmit }: CategorySetupDialogContentProps) {
  return (
    <DialogContent>
      <DialogHeader icon={<Tags />} tone="brand">
        <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        <DialogDescription>Escolha o grupo correto para combinar com os tipos de lançamento.</DialogDescription>
      </DialogHeader>
      <form action={onSubmit} className="grid gap-4">
        <FinanceField label="Nome">
          <Input
            name="name"
            list="category-catalog-suggestions"
            autoComplete="off"
            defaultValue={category?.name ?? ""}
            placeholder="Nome da categoria"
            onChange={(event) => onNameChange(event.target.value)}
          />
        </FinanceField>
        <datalist id="category-catalog-suggestions">
          {CATEGORY_CATALOG.map((entry) => <option key={entry.name} value={entry.name}>{`${entry.emoji} ${categoryGroupLabels[entry.group]}`}</option>)}
        </datalist>
        <FinanceField label="Grupo">
          <FormSelect name="group" value={selectedGroup} onValueChange={(value) => onGroupChange(value as CategoryRow["group"])}>
            {Object.entries(categoryGroupLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </FormSelect>
        </FinanceField>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : category ? "Salvar alterações" : "Criar categoria"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
