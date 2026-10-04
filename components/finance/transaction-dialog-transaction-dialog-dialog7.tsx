"use client";

import { SetupCallout } from "@/components/finance/setup-dialogs";
import { TransactionDialogDiv6 } from "@/components/finance/transaction-dialog-transaction-dialog-div6";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TransactionDialogDialog7Props } from "@/lib/interfaces/render/transaction-dialog-transaction-dialog-dialog7";
import { labelClassName } from "@/lib/utils/components/transaction-dialog";
import { Plus } from "lucide-react";

export function TransactionDialogDialog7({ open, handleOpenChange, trigger, transaction, accounts, startTransition, onSubmit, formId, selectedType, handleTypeChange, isManualExpense, fundingSource, setFundingSource, isInvestmentExpense, selectedAccountId, setSelectedAccountId, filteredAccounts, selectedCategoryId, setSelectedCategoryId, categoryRequired, filteredCategories, transactionDate, setTransactionDate, competenceMonth, setCompetenceMonth, formError, isPending }: TransactionDialogDialog7Props) {
  return (
<Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="size-4" />
              Novo lançamento
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-border bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {transaction ? "Editar lançamento" : "Novo lançamento"}
            </DialogTitle>
            <DialogDescription>
              Receitas e despesas podem ficar sem categoria agora e ser
              organizadas depois. Aportes e resgates continuam exigindo
              categoria.
            </DialogDescription>
          </DialogHeader>
          {accounts.length ? (
            <form
              key={`${transaction?.id ?? "new"}-${open}`}
              action={(formData) =>
                startTransition(() => void onSubmit(formData))
              }
              className="grid gap-5"
            >
              <TransactionDialogDiv6 formId={formId} selectedType={selectedType} handleTypeChange={handleTypeChange} transaction={transaction} isManualExpense={isManualExpense} fundingSource={fundingSource} setFundingSource={setFundingSource} isInvestmentExpense={isInvestmentExpense} selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId} filteredAccounts={filteredAccounts} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} categoryRequired={categoryRequired} filteredCategories={filteredCategories} transactionDate={transactionDate} setTransactionDate={setTransactionDate} competenceMonth={competenceMonth} setCompetenceMonth={setCompetenceMonth} />
              <div className="space-y-2">
                <Label htmlFor={`${formId}-notes`} className={labelClassName}>
                  Observações{" "}
                  <span className="normal-case tracking-normal text-content-subtle">
                    (opcional)
                  </span>
                </Label>
                <Textarea
                  id={`${formId}-notes`}
                  name="notes"
                  defaultValue={transaction?.notes ?? ""}
                  placeholder="Contexto adicional para este lançamento"
                  className="min-h-20 rounded-xl border-input bg-card text-sm text-content-strong placeholder:text-content-subtle focus-visible:border-brand/70 focus-visible:ring-brand/20"
                />
              </div>
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
                    : transaction
                      ? "Salvar alterações"
                      : "Criar lançamento"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <SetupCallout
              title="Sem contas cadastradas"
              description="Crie pelo menos uma conta antes de registrar uma movimentação."
            />
          )}
        </DialogContent>
      </Dialog>
  );
}
