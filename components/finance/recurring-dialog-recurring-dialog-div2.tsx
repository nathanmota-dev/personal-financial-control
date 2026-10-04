"use client";

import { Label } from "@/components/ui/label";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import type { RecurringDialogDiv2Props } from "@/lib/interfaces/render/recurring-dialog-recurring-dialog-div2";
import { cn } from "@/lib/utils";
import { recurringFieldClassName,recurringFieldLabelClassName,recurringSelectContentClassName,recurringSelectItemClassName,recurringSelectTriggerClassName } from "@/lib/utils/components/recurring-dialog";

export function RecurringDialogDiv2({ formId, template }: RecurringDialogDiv2Props) {
  return (
<div className="space-y-2">
                <Label
                  htmlFor={`${formId}-status`}
                  className={recurringFieldLabelClassName}
                >
                  Status da recorrência
                </Label>
                {template?.status === "ended" ? (
                  <>
                    <input type="hidden" name="status" value="ended" />
                    <div
                      className={cn(
                        recurringFieldClassName,
                        "flex items-center px-4 text-content",
                      )}
                    >
                      Encerrada (registro antigo)
                    </div>
                  </>
                ) : (
                  <Select
                    name="status"
                    defaultValue={template?.status ?? "active"}
                  >
                    <SelectTrigger
                      id={`${formId}-status`}
                      className={recurringSelectTriggerClassName}
                    >
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className={recurringSelectContentClassName}>
                      <SelectItem
                        value="active"
                        className={recurringSelectItemClassName}
                      >
                        Ativa
                      </SelectItem>
                      <SelectItem
                        value="paused"
                        className={recurringSelectItemClassName}
                      >
                        Pausada
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
  );
}
