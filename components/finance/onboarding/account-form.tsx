"use client";

import { Plus } from "lucide-react";
import { useImperativeHandle, useRef, useState } from "react";
import { FormSelect } from "@/components/finance/form-select";
import { MoneyInput } from "@/components/finance/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import { useOnboardingAccountSubmit } from "@/hooks/use-onboarding-account-submit";
import { moneyInputToCents } from "@/lib/finance-ui";
import type { OnboardingAccountFormProps, OnboardingBankAccountType } from "@/lib/interfaces/onboarding";
import { ONBOARDING_ACCOUNT_TYPES } from "@/lib/onboarding/steps";

const prefix = "onboarding-account";
const emptyDraft = { name: "", type: "checking" as OnboardingBankAccountType, balance: "" };

export function OnboardingAccountForm({ onSaved, onBusyChange, disabled, ref }: OnboardingAccountFormProps) {
  const [draft, setDraft] = useState(emptyDraft);
  const formRef = useRef<HTMLFormElement>(null);
  const { error, saving, create } = useOnboardingAccountSubmit({ onSaved, onBusyChange, disabled });

  async function submit() {
    const saved = await create({ name: draft.name.trim(), type: draft.type, initialBalanceCents: draft.balance ? moneyInputToCents(draft.balance) : 0 });
    if (saved) setDraft(emptyDraft);
    return saved;
  }

  useImperativeHandle(ref, () => ({
    submitPending: async () => !draft.name.trim() || (formRef.current?.reportValidity() !== false && await submit()),
  }));

  return <form ref={formRef} aria-label="Nova conta" onSubmit={event => { event.preventDefault(); void submit(); }}>
    <fieldset disabled={disabled || saving} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>Nome da conta</Label>
        <Input id={`${prefix}-name`} name="name" required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Ex.: Conta do banco" />
      </div>
      <div className="grid gap-4 @sm:grid-cols-2">
        <div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-type`}>Tipo de conta</Label>
          <FormSelect id={`${prefix}-type`} value={draft.type} onValueChange={type => setDraft({ ...draft, type: type as OnboardingBankAccountType })} className="w-full">
            {Object.entries(ONBOARDING_ACCOUNT_TYPES).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </FormSelect>
        </div>
        <div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-balance`}>Saldo inicial (R$)</Label>
          <MoneyInput id={`${prefix}-balance`} name="balance" value={draft.balance} onValueChange={balance => setDraft(current => ({ ...current, balance }))} placeholder="0,00" />
        </div>
      </div>
      <Button type="submit" variant="secondary" className="h-10 w-full gap-[10px] rounded-[10px] text-[13px] font-medium"><Plus className="size-[17px]" />{saving ? "Salvando…" : "Salvar conta"}</Button>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
  </form>;
}
