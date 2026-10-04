"use client";

import {
GOAL_COLORS
} from "@/components/finance/goals/goals-constants";
import { Label } from "@/components/ui/label";
import type { GoalFormDialogDiv1Props } from "@/lib/interfaces/render/goal-form-dialog-goal-form-dialog-div1";
import { cn } from "@/lib/utils";

export function GoalFormDialogDiv1({ setForm, form }: GoalFormDialogDiv1Props) {
  return (
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
                    form.color === color ? "border-ring" : "border-input"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
  );
}
