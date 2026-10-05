"use client";
import { Copy } from "lucide-react";
import { toast } from "sonner";
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
        report(result.ok ? `${result.data} limite(s) copiado(s). Valores existentes preservados.` : result.error.message);
      } catch { report("Não foi possível copiar. Tente novamente."); }
    });
  }
  function report(value: string) { setMessage(value); toast(value); }
  return <div className="relative"><Button variant="secondary" disabled={pending} onClick={copy}><Copy className="size-4" />{pending ? "Copiando…" : "Copiar mês anterior"}</Button><p role="status" className="sr-only">{message}</p></div>;
}
