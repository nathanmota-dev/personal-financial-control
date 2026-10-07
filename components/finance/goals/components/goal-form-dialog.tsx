"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";

import { Button } from "@/components/ui/button";
import {
Dialog,

DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GoalFormDialogDiv1 } from "./goal-form-dialog-goal-form-dialog-div1";
import { GoalFormDialogDiv2 } from "./goal-form-dialog-goal-form-dialog-div2";

import type { GoalFormDialogProps } from "../goals-types";

export function GoalFormDialog({
  open,
  mode,
  form,
  setForm,
  categories,
  statuses,
  isPending,
  onOpenChange,
  onSubmit,
}: GoalFormDialogProps) {
  const isCreate = mode === "create";
  const isSubmitDisabled =
    isPending || !form.name || !form.targetAmount || !form.targetDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-content-strong sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Nova meta" : "Editar meta"}</DialogTitle>
          <DialogDescription className="text-content">
            Defina o alvo, prazo e quanto da carteira já deve ficar separado.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <GoalFormDialogDiv2  form={form} setForm={setForm} categories={categories} statuses={statuses} isCreate={isCreate} />

          <GoalFormDialogDiv1  setForm={setForm} form={form} />

          <div className="space-y-2">
            <Label htmlFor="goal-notes" className="text-content-strong">
              Notas
            </Label>
            <Textarea
              id="goal-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((state) => ({ ...state, notes: event.target.value }))
              }
              className="min-h-24 border-input bg-card text-content-strong"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isPending ? "Salvando..." : isCreate ? "Criar meta" : "Salvar meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
