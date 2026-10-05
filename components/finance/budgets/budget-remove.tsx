"use client";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
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
        report(result.ok ? "Limite removido." : result.error.message);
      } catch { report("Não foi possível remover. Tente novamente."); }
    });
  }
  function report(value: string) { setMessage(value); toast(value); }
  return <div><Button variant="outline" size="icon-sm" aria-label="Remover limite" disabled={pending} onClick={remove}><Trash2 className="size-4" /></Button><p role="status" className="sr-only">{message}</p></div>;
}
