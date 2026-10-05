"use client";
import { useState, useTransition } from "react";
import { copyPreviousBudgetsAction } from "@/app/actions/finance/budgets";
import type { BudgetMonthProps } from "@/lib/interfaces/budgets";
import { Button } from "@/components/ui/button";

export function BudgetCopy({ month }: BudgetMonthProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function copy() {
    startTransition(async () => {
      try {
        const result = await copyPreviousBudgetsAction(month);
        setMessage(result.ok ? `${result.data} limite(s) copiado(s). Valores existentes preservados.` : result.error.message);
      } catch { setMessage("Não foi possível copiar. Tente novamente."); }
    });
  }
  return <div className="space-y-2"><Button variant="outline" disabled={pending} onClick={copy}>{pending ? "Copiando…" : "Copiar limites do mês anterior"}</Button><p role="status" className="max-w-sm text-sm text-content">{message}</p></div>;
}
