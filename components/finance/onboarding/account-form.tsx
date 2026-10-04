"use client";

import { useRef, useState } from "react";
import { createAccountAction } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingAccountFormProps } from "@/lib/interfaces/onboarding";

export function OnboardingAccountForm({ credit, onSaved, onBusyChange, disabled }: OnboardingAccountFormProps) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const prefix = credit ? "onboarding-card" : "onboarding-account";

  async function submit(form: HTMLFormElement) {
    if (lock.current || disabled) return;
    const data = new FormData(form);
    const name = String(data.get("name")).trim();
    if (!name) { setError("Informe um nome."); return; }
    lock.current = true;
    setSaving(true);
    onBusyChange(true);
    setError("");
    try {
      const account = await createAccountAction({
        name,
        type: credit ? "credit" : data.get("type") as "checking" | "savings" | "cash",
        initialBalanceCents: credit ? 0 : Math.round(Number(data.get("balance")) * 100),
        ...(credit ? { creditClosingDay: Number(data.get("closing")), creditDueDay: Number(data.get("due")) } : {}),
      });
      onSaved(account);
      form.reset();
    } catch { setError("Não foi possível salvar. Confira os dados e tente novamente."); }
    finally { lock.current = false; setSaving(false); onBusyChange(false); }
  }

  return <form onSubmit={event => { event.preventDefault(); void submit(event.currentTarget); }}>
    <fieldset disabled={disabled || saving} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>Nome {credit ? "do cartão" : "da conta"}</Label>
        <Input id={`${prefix}-name`} name="name" required placeholder={credit ? "Ex.: Cartão principal" : "Ex.: Conta do banco"} />
      </div>
      {credit ? <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor={`${prefix}-closing`}>Dia de fechamento</Label><Input id={`${prefix}-closing`} name="closing" type="number" min="1" max="31" step="1" required /></div>
        <div className="space-y-2"><Label htmlFor={`${prefix}-due`}>Dia de vencimento</Label><Input id={`${prefix}-due`} name="due" type="number" min="1" max="31" step="1" required /></div>
      </div> : <>
        <div className="space-y-2"><Label htmlFor={`${prefix}-type`}>Tipo de conta</Label>
          <select id={`${prefix}-type`} name="type" className="h-10 w-full rounded-md border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-ring">
            <option value="checking">Corrente</option><option value="savings">Poupança</option><option value="cash">Dinheiro</option>
          </select>
        </div>
        <div className="space-y-2"><Label htmlFor={`${prefix}-balance`}>Saldo inicial (R$)</Label><Input id={`${prefix}-balance`} name="balance" type="number" step="0.01" defaultValue="0" required /></div>
      </>}
      <Button type="submit" variant="outline" className="w-full">{saving ? "Salvando…" : credit ? "Salvar cartão" : "Salvar conta"}</Button>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </form>;
}
