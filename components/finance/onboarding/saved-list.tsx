"use client";

import { Banknote, CreditCard, Landmark, PiggyBank } from "lucide-react";
import { IconTile } from "@/components/finance/ds/icon-tile";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { OnboardingBankAccountType, OnboardingSavedListProps } from "@/lib/interfaces/onboarding";
import { ONBOARDING_ACCOUNT_TYPES } from "@/lib/onboarding/steps";
import { formatCardDay } from "@/lib/settings-cards";

const icons = { checking: Landmark, savings: PiggyBank, cash: Banknote };

export function OnboardingSavedList({ credit, items }: OnboardingSavedListProps) {
  const { formatCurrency } = useFinancialFormatter();
  return <div aria-live="polite" className="min-w-0">
    <p className="text-[10px] font-bold tracking-wider text-content uppercase">{credit ? "Cartões cadastrados" : "Contas cadastradas"} ({items.length})</p>
    {items.length ? <ul className="mt-2 max-h-[220px] divide-y divide-border overflow-y-auto">{items.map(account => {
      const Icon = credit ? CreditCard : icons[account.type as OnboardingBankAccountType] ?? Landmark;
      return <li key={account.id} className="flex items-center gap-3 py-2.5">
        <IconTile tone="brand"><Icon /></IconTile>
        <div className="min-w-0 flex-1">
          <span data-user-content className="block truncate text-[13px] font-semibold text-content-strong">{account.name}</span>
          <span className="block text-xs text-content">{credit ? `Fecha ${formatCardDay(account.creditClosingDay).toLowerCase()} · Vence ${formatCardDay(account.creditDueDay).toLowerCase()}` : ONBOARDING_ACCOUNT_TYPES[account.type as OnboardingBankAccountType] ?? "Conta"}</span>
        </div>
        {credit ? null : <span className="shrink-0 text-[13px] font-semibold tabular-nums text-content-strong">{formatCurrency(account.initialBalanceCents)}</span>}
      </li>;
    })}</ul> : <p className="mt-2 rounded-[14px] border border-dashed border-border px-4 py-5 text-center text-xs text-content-muted">Nenhum cadastro ainda. Você pode pular esta etapa.</p>}
  </div>;
}
