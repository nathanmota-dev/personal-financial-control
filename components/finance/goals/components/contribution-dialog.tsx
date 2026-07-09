"use client";

import { InlineWarning } from "@/components/finance/inline-warning";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ContributionDialogProps } from "../goals-types";
import { LabeledInput } from "./labeled-input";
import { SelectField } from "./select-field";

export function ContributionDialog({
  state,
  form,
  setForm,
  sourceAccounts,
  investmentCategories,
  isPending,
  onOpenChange,
  onSubmit,
}: ContributionDialogProps) {
  const canSubmit =
    form.amount &&
    form.transactionDate &&
    form.accountId &&
    form.categoryId &&
    sourceAccounts.length &&
    investmentCategories.length;

  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar aporte</DialogTitle>
          <DialogDescription className="text-slate-400">
            {state?.goal.name ?? "Meta"}
          </DialogDescription>
        </DialogHeader>

        {!sourceAccounts.length || !investmentCategories.length ? (
          <InlineWarning message="Cadastre uma conta de origem e uma categoria de investimento para registrar aportes vinculados." />
        ) : null}

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <LabeledInput
            id="goal-contribution-amount"
            label="Valor do aporte"
            value={form.amount}
            placeholder="0,00"
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: event.target.value }))
            }
          />
          <LabeledInput
            id="goal-contribution-date"
            label="Data"
            type="date"
            value={form.transactionDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                transactionDate: event.target.value,
              }))
            }
          />
          <SelectField
            label="Conta de origem"
            value={form.accountId}
            onValueChange={(accountId) =>
              setForm((current) => ({ ...current, accountId }))
            }
            options={sourceAccounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
          />
          <SelectField
            label="Categoria de investimento"
            value={form.categoryId}
            onValueChange={(categoryId) =>
              setForm((current) => ({ ...current, categoryId }))
            }
            options={investmentCategories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
          <div className="space-y-2">
            <Label htmlFor="goal-contribution-notes" className="text-slate-200">
              Notas
            </Label>
            <Textarea
              id="goal-contribution-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              className="min-h-20 border-slate-700 bg-slate-950/70 text-slate-100"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? "Registrando..." : "Registrar aporte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
