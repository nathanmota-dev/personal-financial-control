"use client";
import { useState, useTransition } from "react";
import { saveBudgetAction } from "@/app/actions/finance/budgets";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/finance/money-input";
import { centsToMoneyInput, moneyInputToCents } from "@/lib/finance-ui";
import type { BudgetFormProps } from "@/lib/interfaces/budgets";

export function BudgetForm({ month, categories, limit }: BudgetFormProps) {
  const [amount, setAmount] = useState(limit ? centsToMoneyInput(limit.amountCents) : "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(form: FormData) {
    startTransition(async () => {
      try {
        const result = await saveBudgetAction({ categoryId: limit?.categoryId ?? String(form.get("categoryId")), competenceMonth: month, amountCents: moneyInputToCents(amount) });
        setMessage(result.ok ? "Limite salvo." : result.error.message);
      } catch { setMessage("Não foi possível salvar. Confira o valor e tente novamente."); }
    });
  }
  return <form onSubmit={(event) => { event.preventDefault(); submit(new FormData(event.currentTarget)); }} className="flex flex-wrap items-end gap-3">
    {!limit && <label className="grid gap-1 text-sm">Categoria
      <select name="categoryId" required className="h-10 rounded-lg border border-input bg-card px-3 text-content-strong" disabled={pending}>
        <option value="">Selecione uma categoria</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
    </label>}
    <label className="grid gap-1 text-sm">Limite mensal (R$)
      <MoneyInput aria-label={limit ? `Limite de ${categories[0]?.name ?? "categoria"}` : "Limite mensal (R$)"} value={amount} onValueChange={setAmount} required disabled={pending} className="w-40" />
    </label>
    <Button type="submit" disabled={pending || (!limit && !categories.length)}>{pending ? "Salvando…" : limit ? "Salvar limite" : "Criar limite"}</Button>
    <p role="status" className="w-full text-sm text-content">{message}</p>
  </form>;
}
