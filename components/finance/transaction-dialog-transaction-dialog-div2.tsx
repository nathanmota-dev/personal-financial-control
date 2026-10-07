"use client";

import { FormSelect } from "@/components/finance/form-select";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { TransactionDialogDiv2Props } from "@/lib/interfaces/render/transaction-dialog-transaction-dialog-div2";
import { labelClassName,selectClassName } from "@/lib/utils/components/transaction-dialog";

export function TransactionDialogDiv2({ formId, isInvestmentExpense, selectedAccountId, setSelectedAccountId, filteredAccounts }: TransactionDialogDiv2Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<div className="space-y-2">
                  <Label
                    htmlFor={`${formId}-account`}
                    className={labelClassName}
                  >
                    {isInvestmentExpense
                      ? "Conta do resgate e da despesa"
                      : "Conta"}
                  </Label>
                  <FormSelect
                    id={`${formId}-account`}
                    name="accountId"
                    value={selectedAccountId}
                    onValueChange={setSelectedAccountId}
                    className={selectClassName}
                    required
                  >
                    {filteredAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} · saldo atual{" "}
                        {formatCurrency(account.currentBalanceCents)}
                      </SelectItem>
                    ))}
                  </FormSelect>
                  {isInvestmentExpense ? (
                    <p className="text-xs text-content">
                      O resgate entra nesta conta e a despesa sai dela, mantendo
                      o efeito líquido zerado.
                    </p>
                  ) : null}
                </div>
  );
}
