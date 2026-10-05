"use client";
import { useState, useTransition } from "react";
import { removeBudgetAction } from "@/app/actions/finance/budgets";
import { Button } from "@/components/ui/button";
import type { BudgetInput } from "@/lib/interfaces/budgets";

export function BudgetRemove({ categoryId, competenceMonth }: Omit<BudgetInput, "amountCents">) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function remove() {
    startTransition(async () => {
      try {
        const result = await removeBudgetAction({ categoryId, competenceMonth });
        setMessage(result.ok ? "Limite removido." : result.error.message);
      } catch { setMessage("Não foi possível remover. Tente novamente."); }
    });
  }
  return <div><Button variant="outline" disabled={pending} onClick={remove}>{pending ? "Removendo…" : "Remover limite"}</Button><p role="status" className="text-sm">{message}</p></div>;
}
