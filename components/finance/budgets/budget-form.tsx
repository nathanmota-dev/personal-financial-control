"use client";

import { useState, useTransition } from "react";
import { saveBudgetAction } from "@/app/actions/finance/budgets";
import { FinanceField } from "@/components/finance/finance-field";
import { MoneyInput } from "@/components/finance/money-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { centsToMoneyInput, moneyInputToCents } from "@/lib/finance-ui";
import type { BudgetFormProps } from "@/lib/interfaces/budgets";

export function BudgetForm({ month, categories, limit, onSaved }: BudgetFormProps) {
  const [amount, setAmount] = useState(limit ? centsToMoneyInput(limit.amountCents) : "");
  const [categoryId, setCategoryId] = useState(limit?.categoryId ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function submit() {
    startTransition(async () => {
      try {
        const result = await saveBudgetAction({ categoryId, competenceMonth: month, amountCents: moneyInputToCents(amount) });
        setMessage(result.ok ? "Limite salvo." : result.error.message);
        if (result.ok) onSaved?.();
      } catch { setMessage("Não foi possível salvar. Confira o valor e tente novamente."); }
    });
  }
  return (
    <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
      {!limit && <FinanceField label="Categoria">
        <Select name="categoryId" value={categoryId} onValueChange={setCategoryId} disabled={pending} required>
          <SelectTrigger aria-label="Categoria" className="w-full"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
          <SelectContent>{categories.map((category) => <SelectItem data-user-content key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
        </Select>
      </FinanceField>}
      <FinanceField label="Limite mensal (R$)">
        <MoneyInput name="amount" aria-label={limit ? `Limite de ${categories[0]?.name ?? "categoria"}` : "Limite mensal (R$)"} value={amount} onValueChange={setAmount} required disabled={pending} placeholder="0,00" />
      </FinanceField>
      <p role="status" className="text-sm text-content">{message}</p>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={pending || !categoryId}>{pending ? "Salvando…" : limit ? "Salvar limite" : "Criar limite"}</Button>
      </div>
    </form>
  );
}
