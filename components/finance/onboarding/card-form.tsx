"use client";

import { Plus } from "lucide-react";
import { useImperativeHandle, useRef, useState } from "react";
import { SettingsCardBrandPicker } from "@/components/finance/settings/settings-card-brand-picker";
import { SettingsCardPreview } from "@/components/finance/settings/settings-card-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingAccountSubmit } from "@/hooks/use-onboarding-account-submit";
import type { CardBrandId } from "@/lib/interfaces/dashboard-cards";
import type { OnboardingCardFormProps } from "@/lib/interfaces/onboarding";
import { buildCardPreview, composeCardName } from "@/lib/settings-cards";

const prefix = "onboarding-card";
const emptyDraft = { brand: "generic" as CardBrandId, product: "", closing: "", due: "" };

export function OnboardingCardForm({ onSaved, onBusyChange, disabled, ref, aside }: OnboardingCardFormProps) {
  const [draft, setDraft] = useState(emptyDraft);
  const formRef = useRef<HTMLFormElement>(null);
  const { error, saving, create } = useOnboardingAccountSubmit({ onSaved, onBusyChange, disabled });

  async function submit() {
    const saved = await create({ name: composeCardName(draft.brand, draft.product), type: "credit", initialBalanceCents: 0, creditClosingDay: Number(draft.closing), creditDueDay: Number(draft.due) });
    if (saved) setDraft(current => ({ ...emptyDraft, brand: current.brand }));
    return saved;
  }

  useImperativeHandle(ref, () => ({
    submitPending: async () => !draft.product.trim() || (formRef.current?.reportValidity() !== false && await submit()),
  }));

  return <div className="grid gap-6 @xl:grid-cols-[minmax(0,1fr)_240px]">
    <form ref={formRef} aria-label="Novo cartão" className="@container min-w-0" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <fieldset disabled={disabled || saving} className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-content-strong">Banco</p>
          <SettingsCardBrandPicker value={draft.brand} onChange={brand => setDraft({ ...draft, brand })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-name`}>Nome do cartão</Label>
          <Input id={`${prefix}-name`} name="name" required value={draft.product} onChange={event => setDraft({ ...draft, product: event.target.value })} placeholder="Ex.: Platinum, Black, Principal" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-closing`}>Dia de fechamento</Label><Input id={`${prefix}-closing`} name="closing" type="number" min="1" max="31" step="1" required value={draft.closing} onChange={event => setDraft({ ...draft, closing: event.target.value })} /></div>
          <div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-due`}>Dia de vencimento</Label><Input id={`${prefix}-due`} name="due" type="number" min="1" max="31" step="1" required value={draft.due} onChange={event => setDraft({ ...draft, due: event.target.value })} /></div>
        </div>
        <Button type="submit" variant="secondary" className="h-10 w-full gap-[10px] rounded-[10px] text-[13px] font-medium"><Plus className="size-[17px]" />{saving ? "Salvando…" : "Salvar cartão"}</Button>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
    </form>
    <div className="min-w-0 space-y-6">
      <div className="space-y-2">
        <p className="text-[10px] font-bold tracking-wider text-content uppercase">Prévia</p>
        <SettingsCardPreview card={buildCardPreview("onboarding-draft", draft.brand, draft.product)} closingDay={draft.closing} dueDay={draft.due} />
      </div>
      {aside}
    </div>
  </div>;
}
