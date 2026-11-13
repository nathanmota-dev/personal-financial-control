"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createAccountAction, updateAccountAction } from "@/app/actions/finance";
import { FinanceField } from "@/components/finance/finance-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CARD_BRAND_THEMES } from "@/lib/credit-card-brands";
import { extractErrorMessage } from "@/lib/finance-ui";
import type { SettingsCardDraft, SettingsCardFormProps } from "@/lib/interfaces/settings";
import { buildCardPreview, composeCardName, parseCardName } from "@/lib/settings-cards";

import { SettingsCardBrandPicker } from "./settings-card-brand-picker";
import { SettingsCardPreview } from "./settings-card-preview";

function initialDraft(card: SettingsCardFormProps["card"]): SettingsCardDraft {
  if (!card) return { brand: "itau", product: "", closingDay: "", dueDay: "10" };
  return { ...parseCardName(card.name), closingDay: card.creditClosingDay ? String(card.creditClosingDay) : "", dueDay: String(card.creditDueDay) };
}

function parseDay(value: string) {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}

export function SettingsCardForm({ card, onDone }: SettingsCardFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => initialDraft(card));
  const [isPending, startTransition] = useTransition();
  const name = composeCardName(draft.brand, draft.product);
  const dueDay = parseDay(draft.dueDay);
  const closingDay = draft.closingDay ? parseDay(draft.closingDay) : null;
  const invalid = !name || !dueDay || (draft.closingDay !== "" && !closingDay);

  function update(next: Partial<SettingsCardDraft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function submit() {
    if (invalid || !dueDay) return;
    const payload = { name, type: "credit" as const, initialBalanceCents: card?.initialBalanceCents ?? 0, creditClosingDay: closingDay ?? undefined, creditDueDay: dueDay };
    startTransition(async () => {
      try {
        if (card) {
          await updateAccountAction({ id: card.id, ...payload });
          toast.success("Cartão atualizado.");
        } else {
          await createAccountAction(payload);
          toast.success("Cartão cadastrado.");
          setDraft(initialDraft(null));
        }
        onDone();
        router.refresh();
      } catch (error) {
        toast.error(extractErrorMessage(error));
      }
    });
  }

  return (
    <section aria-label={card ? "Editar cartão" : "Novo cartão"} className="@container relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-[25px]">{card ? "Editar cartão" : "Novo cartão"}</h2>
          <p className="mt-1 text-xs text-content-muted">Escolha o banco e preencha os dias; o cartão ao lado mostra como ele vai aparecer no app</p>
        </div>
        {card ? <Button type="button" variant="ghost" size="sm" onClick={onDone}><X className="size-4" />Cancelar edição</Button> : null}
      </div>
      <form
        className="mt-5 grid gap-6 @3xl:grid-cols-[minmax(0,1fr)_300px]"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="min-w-0 space-y-5">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-content uppercase">Banco</p>
            <div className="mt-2"><SettingsCardBrandPicker value={draft.brand} onChange={(brand) => update({ brand })} /></div>
          </div>
          <FinanceField label={draft.brand === "generic" ? "Nome do cartão" : `Nome no cartão (ex.: ${draft.brand === "itau" ? "Click" : "Platinum"})`}>
            <Input value={draft.product} onChange={(event) => update({ product: event.target.value })} placeholder={draft.brand === "generic" ? "Ex.: Visa Platinum" : "Opcional"} />
          </FinanceField>
          <div className="grid grid-cols-2 gap-4">
            <FinanceField label="Dia do fechamento">
              <Input type="number" min="1" max="31" inputMode="numeric" value={draft.closingDay} onChange={(event) => update({ closingDay: event.target.value })} placeholder="Ex.: 3" />
            </FinanceField>
            <FinanceField label="Dia do vencimento">
              <Input type="number" min="1" max="31" inputMode="numeric" value={draft.dueDay} onChange={(event) => update({ dueDay: event.target.value })} placeholder="Ex.: 10" />
            </FinanceField>
          </div>
          <Button type="submit" disabled={isPending || invalid} className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium">
            <Check className="size-[17px]" />
            {isPending ? "Salvando..." : card ? "Salvar cartão" : "Cadastrar cartão"}
          </Button>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wider text-content uppercase">Prévia</p>
          <div className="mt-2">
            <SettingsCardPreview card={buildCardPreview(card?.id ?? "preview", draft.brand, draft.product)} closingDay={draft.closingDay} dueDay={draft.dueDay} />
          </div>
          <p data-user-content className="mt-4 truncate text-center text-xs text-content-muted">{name || `${CARD_BRAND_THEMES[draft.brand].label} sem nome`}</p>
        </div>
      </form>
    </section>
  );
}
