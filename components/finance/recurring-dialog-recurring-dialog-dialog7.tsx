"use client";

import { RecurringDialogDiv6 } from "@/components/finance/recurring-dialog-recurring-dialog-div6";
import { SetupCallout } from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecurringDialogDialog7Props } from "@/lib/interfaces/render/recurring-dialog-recurring-dialog-dialog7";
import { cn } from "@/lib/utils";
import { recurringFieldClassName,recurringFieldLabelClassName } from "@/lib/utils/components/recurring-dialog";
import { Plus } from "lucide-react";

export function RecurringDialogDialog7({ open, handleOpenChange, trigger, template, hasSetup, startTransition, onSubmit, formId, selectedType, handleTypeChange, selectedAccountId, setSelectedAccountId, filteredAccounts, selectedCategoryId, setSelectedCategoryId, filteredCategories, startMonth, setStartMonth, endMonth, setEndMonth, formError, isPending }: RecurringDialogDialog7Props) {
  return (
<Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Nova recorrência
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar recorrência" : "Nova recorrência"}
          </DialogTitle>
          <DialogDescription>
            Defina o compromisso que deve reaparecer todo mês. A categoria fica
            registrada em cada lançamento gerado.
          </DialogDescription>
        </DialogHeader>
        {hasSetup ? (
          <form
            key={`${template?.id ?? "new"}-${open}`}
            action={(formData) =>
              startTransition(() => void onSubmit(formData))
            }
            className="grid gap-5"
          >
            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-name`}
                className={recurringFieldLabelClassName}
              >
                Nome da recorrência
              </Label>
              <Input
                id={`${formId}-name`}
                name="name"
                autoFocus
                required
                defaultValue={template?.description ?? ""}
                placeholder="Ex.: aluguel, academia ou salário"
                className={cn(recurringFieldClassName, "")}
              />
              <p className="mt-2 text-xs leading-5 text-content">
                Este nome identifica a regra e os lançamentos gerados por ela.
              </p>
            </div>

            <RecurringDialogDiv6 formId={formId} selectedType={selectedType} handleTypeChange={handleTypeChange} template={template} selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId} filteredAccounts={filteredAccounts} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} filteredCategories={filteredCategories} startMonth={startMonth} setStartMonth={setStartMonth} endMonth={endMonth} setEndMonth={setEndMonth} />

            {formError ? (
              <p
                className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={isPending} className="min-w-40">
                {isPending
                  ? "Salvando..."
                  : template
                    ? "Salvar alterações"
                    : "Criar recorrência"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <SetupCallout
            title="Sem base inicial para recorrências"
            description="Crie conta e categoria antes de cadastrar uma recorrência."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
