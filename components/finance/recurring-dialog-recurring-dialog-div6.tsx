"use client";

import { RecurringDialogDiv1 } from "@/components/finance/recurring-dialog-recurring-dialog-div1";
import { RecurringDialogDiv2 } from "@/components/finance/recurring-dialog-recurring-dialog-div2";
import { RecurringDialogDiv3 } from "@/components/finance/recurring-dialog-recurring-dialog-div3";
import { RecurringDialogDiv4 } from "@/components/finance/recurring-dialog-recurring-dialog-div4";
import { RecurringDialogDiv5 } from "@/components/finance/recurring-dialog-recurring-dialog-div5";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import type { RecurringDialogDiv6Props } from "@/lib/interfaces/render/recurring-dialog-recurring-dialog-div6";
import { recurringFieldClassName,recurringFieldLabelClassName } from "@/lib/utils/components/recurring-dialog";

export function RecurringDialogDiv6({ formId, selectedType, handleTypeChange, template, selectedAccountId, setSelectedAccountId, filteredAccounts, selectedCategoryId, setSelectedCategoryId, filteredCategories, startMonth, setStartMonth, endMonth, setEndMonth }: RecurringDialogDiv6Props) {
  return (
<div className="grid gap-4 md:grid-cols-2">
              <RecurringDialogDiv1 formId={formId} selectedType={selectedType} handleTypeChange={handleTypeChange} />

              <RecurringDialogDiv2 formId={formId} template={template} />

              <RecurringDialogDiv3 formId={formId} selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId} filteredAccounts={filteredAccounts} />

              <RecurringDialogDiv4 formId={formId} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} filteredCategories={filteredCategories} selectedType={selectedType} />

              <RecurringDialogDiv5 formId={formId} template={template} />

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-day`}
                  className={recurringFieldLabelClassName}
                >
                  Dia do lançamento
                </Label>
                <Input
                  id={`${formId}-day`}
                  name="dayOfMonth"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  required
                  defaultValue={template?.dayOfMonth ?? 5}
                  placeholder="Ex.: 5"
                  className={recurringFieldClassName}
                />
                <p className="text-xs text-content">
                  Em meses menores, usamos o último dia disponível.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-start-month`}
                  className={recurringFieldLabelClassName}
                >
                  Mês de início
                </Label>
                <MonthPickerField
                  id={`${formId}-start-month`}
                  name="startMonth"
                  value={startMonth}
                  placeholder="Selecione o mês de início"
                  required
                  onMonthChange={(nextMonth) => {
                    if (nextMonth) setStartMonth(nextMonth);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-end-month`}
                  className={recurringFieldLabelClassName}
                >
                  Mês de encerramento{" "}
                  <span className="normal-case tracking-normal text-content-subtle">
                    (opcional)
                  </span>
                </Label>
                <MonthPickerField
                  id={`${formId}-end-month`}
                  name="endMonth"
                  value={endMonth}
                  placeholder="Sem fim"
                  clearable
                  onMonthChange={setEndMonth}
                />
              </div>
            </div>
  );
}
