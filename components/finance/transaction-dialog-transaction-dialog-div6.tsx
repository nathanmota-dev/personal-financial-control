"use client";

import { FormSelect } from "@/components/finance/form-select";
import { TransactionDialogDiv2 } from "@/components/finance/transaction-dialog-transaction-dialog-div2";
import { TransactionDialogDiv3 } from "@/components/finance/transaction-dialog-transaction-dialog-div3";
import { TransactionDialogDiv4 } from "@/components/finance/transaction-dialog-transaction-dialog-div4";
import { TransactionDialogDiv5 } from "@/components/finance/transaction-dialog-transaction-dialog-div5";
import { TransactionDialogFieldset1 } from "@/components/finance/transaction-dialog-transaction-dialog-fieldset1";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import { SelectItem } from "@/components/ui/select";
import type { TransactionDialogDiv6Props } from "@/lib/interfaces/render/transaction-dialog-transaction-dialog-div6";
import { fieldClassName,labelClassName,selectClassName } from "@/lib/utils/components/transaction-dialog";

export function TransactionDialogDiv6({ formId, selectedType, handleTypeChange, transaction, isManualExpense, fundingSource, setFundingSource, isInvestmentExpense, selectedAccountId, setSelectedAccountId, filteredAccounts, selectedCategoryId, setSelectedCategoryId, categoryRequired, filteredCategories, transactionDate, setTransactionDate, competenceMonth, setCompetenceMonth }: TransactionDialogDiv6Props) {
  return (
<div className="grid gap-4 md:grid-cols-2">
                <TransactionDialogDiv4 formId={formId} selectedType={selectedType} handleTypeChange={handleTypeChange} />
                <div className="space-y-2">
                  <Label
                    htmlFor={`${formId}-status`}
                    className={labelClassName}
                  >
                    Status
                  </Label>
                  <FormSelect
                    id={`${formId}-status`}
                    name="status"
                    defaultValue={transaction?.status ?? "posted"}
                    className={selectClassName}
                  >
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="posted">Lançado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </FormSelect>
                </div>
                {isManualExpense ? (
                  <TransactionDialogFieldset1 fundingSource={fundingSource} setFundingSource={setFundingSource} />
                ) : null}
                <TransactionDialogDiv2 formId={formId} isInvestmentExpense={isInvestmentExpense} selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId} filteredAccounts={filteredAccounts} />
                <TransactionDialogDiv3 formId={formId} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} categoryRequired={categoryRequired} filteredCategories={filteredCategories} />
                <TransactionDialogDiv5 formId={formId} transaction={transaction} />
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-date`} className={labelClassName}>
                    Data
                  </Label>
                  <DatePickerField
                    id={`${formId}-date`}
                    name="transactionDate"
                    value={transactionDate}
                    required
                    onDateChange={(nextDate) => {
                      if (nextDate) setTransactionDate(nextDate);
                    }}
                    className={fieldClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`${formId}-competence`}
                    className={labelClassName}
                  >
                    Competência
                  </Label>
                  <MonthPickerField
                    id={`${formId}-competence`}
                    name="competenceMonth"
                    value={competenceMonth}
                    required
                    onMonthChange={(nextMonth) => {
                      if (nextMonth) setCompetenceMonth(nextMonth);
                    }}
                    className={fieldClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`${formId}-description`}
                    className={labelClassName}
                  >
                    Descrição
                  </Label>
                  <Input
                    id={`${formId}-description`}
                    name="description"
                    defaultValue={transaction?.description ?? ""}
                    placeholder="Ex.: mercado, salário ou assinatura"
                    className={fieldClassName}
                    required
                  />
                </div>
              </div>
  );
}
