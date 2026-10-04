"use client";

import { LabeledInput } from "@/components/finance/goals/components/labeled-input";
import { SelectField } from "@/components/finance/goals/components/select-field";
import {
GOAL_CATEGORY_LABELS,
GOAL_PRIORITY_OPTIONS,
GOAL_STATUS_LABELS
} from "@/components/finance/goals/goals-constants";
import type { GoalCategory,GoalStatus } from "@/components/finance/goals/goals-types";
import { Label } from "@/components/ui/label";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import type { GoalFormDialogDiv2Props } from "@/lib/interfaces/render/goal-form-dialog-goal-form-dialog-div2";

export function GoalFormDialogDiv2({ form, setForm, categories, statuses, isCreate }: GoalFormDialogDiv2Props) {
  return (
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
            <LabeledInput monetary
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
            <LabeledInput monetary
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
              <LabeledInput monetary
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
  );
}
