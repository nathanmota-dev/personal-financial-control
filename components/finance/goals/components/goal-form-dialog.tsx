"use client";

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
import { MonthPickerField } from "@/components/ui/month-picker-field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  GOAL_CATEGORY_LABELS,
  GOAL_COLORS,
  GOAL_PRIORITY_OPTIONS,
  GOAL_STATUS_LABELS,
} from "../goals-constants";
import type { GoalCategory, GoalFormDialogProps, GoalStatus } from "../goals-types";
import { LabeledInput } from "./labeled-input";
import { SelectField } from "./select-field";

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
      <DialogContent className="border-border bg-surface text-content-strong sm:max-w-2xl">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput
              id="goal-name"
              label="Nome"
              value={form.name}
              onChange={(event) =>
                setForm((state) => ({ ...state, name: event.target.value }))
              }
            />
            <SelectField
              label="Categoria"
              value={form.category}
              onValueChange={(category) =>
                setForm((state) => ({
                  ...state,
                  category: category as GoalCategory,
                }))
              }
              options={categories.map((category) => ({
                value: category,
                label: GOAL_CATEGORY_LABELS[category],
              }))}
            />
            <LabeledInput
              id="goal-target"
              label="Valor alvo"
              value={form.targetAmount}
              placeholder="0,00"
              onChange={(event) =>
                setForm((state) => ({ ...state, targetAmount: event.target.value }))
              }
            />
            <div className="space-y-2">
              <Label className="text-content-strong">Prazo</Label>
              <MonthPickerField
                month={form.targetDate}
                onMonthChange={(targetDate) => {
                  if (targetDate) {
                    setForm((state) => ({ ...state, targetDate }));
                  }
                }}
                className="w-full"
              />
            </div>
            <LabeledInput
              id="goal-planned-monthly"
              label="Aporte mensal planejado"
              value={form.plannedMonthlyContribution}
              placeholder="0,00"
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  plannedMonthlyContribution: event.target.value,
                }))
              }
            />
            <SelectField
              label="Prioridade"
              value={form.priority}
              onValueChange={(priority) =>
                setForm((state) => ({ ...state, priority }))
              }
              options={[...GOAL_PRIORITY_OPTIONS]}
            />
            <SelectField
              label="Status"
              value={form.status}
              onValueChange={(status) =>
                setForm((state) => ({
                  ...state,
                  status: status as GoalStatus,
                }))
              }
              options={statuses.map((status) => ({
                value: status,
                label: GOAL_STATUS_LABELS[status],
              }))}
            />
            {isCreate ? (
              <LabeledInput
                id="goal-initial-allocation"
                label="Alocação inicial"
                value={form.initialAllocation}
                placeholder="0,00"
                onChange={(event) =>
                  setForm((state) => ({
                    ...state,
                    initialAllocation: event.target.value,
                  }))
                }
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-content-strong">Cor</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Selecionar cor ${color}`}
                  onClick={() => setForm((state) => ({ ...state, color }))}
                  className={cn(
                    "size-8 rounded-full border-2 transition",
                    form.color === color ? "border-white" : "border-input"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

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
              className="min-h-24 border-input bg-surface/70 text-content-strong"
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
