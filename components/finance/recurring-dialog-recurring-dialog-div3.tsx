"use client";

import { Label } from "@/components/ui/label";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import type { RecurringDialogDiv3Props } from "@/lib/interfaces/render/recurring-dialog-recurring-dialog-div3";
import { recurringFieldLabelClassName,recurringSelectContentClassName,recurringSelectItemClassName,recurringSelectTriggerClassName } from "@/lib/utils/components/recurring-dialog";

export function RecurringDialogDiv3({ formId, selectedAccountId, setSelectedAccountId, filteredAccounts }: RecurringDialogDiv3Props) {
  return (
<div className="space-y-2">
                <Label
                  htmlFor={`${formId}-account`}
                  className={recurringFieldLabelClassName}
                >
                  Conta de origem
                </Label>
                <Select
                  name="accountId"
                  value={selectedAccountId || undefined}
                  onValueChange={setSelectedAccountId}
                >
                  <SelectTrigger
                    id={`${formId}-account`}
                    className={recurringSelectTriggerClassName}
                  >
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent className={recurringSelectContentClassName}>
                    {filteredAccounts.map((account) => (
                      <SelectItem data-user-content
                        key={account.id}
                        value={account.id}
                        className={recurringSelectItemClassName}
                      >
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
  );
}
