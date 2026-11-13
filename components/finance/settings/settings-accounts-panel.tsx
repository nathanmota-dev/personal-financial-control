"use client";

import { Plus } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { AccountSetupDialog } from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import type { SettingsAccountsPanelProps } from "@/lib/interfaces/settings";

import { SettingsAccountRow } from "./settings-account-row";

export function SettingsAccountsPanel({ title, description, emptyTitle, emptyDescription, newLabel, illustrationSrc, accounts, allowedTypes }: SettingsAccountsPanelProps) {
  const active = accounts.filter((account) => !account.isArchived);
  const totalCents = active.reduce((sum, account) => sum + account.currentBalanceCents, 0);
  const sorted = [...accounts].sort((left, right) => Number(left.isArchived) - Number(right.isArchived) || right.currentBalanceCents - left.currentBalanceCents);
  const newButton = <AccountSetupDialog allowedTypes={allowedTypes} trigger={<Button className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium"><Plus className="size-[17px]" />{newLabel}</Button>} />;
  return (
    <section aria-label={title} className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src={illustrationSrc} className="top-4 right-6 size-[96px]" />
      <h2 className="text-sm font-semibold text-content-strong">{title}</h2>
      <DashboardCardsMoney cents={totalCents} className="mt-4 block text-[40px] leading-[44px] font-bold text-content-strong" />
      <p className="mt-2 pr-24 text-xs text-content">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-[10px] font-bold tracking-wider text-content uppercase">{`${active.length} ativa(s) · ${accounts.length - active.length} arquivada(s)`}</p>
        {newButton}
      </div>
      {accounts.length ? (
        <ul className="mt-2 divide-y divide-border">
          {sorted.map((account) => <SettingsAccountRow key={account.id} account={account} allowedTypes={allowedTypes} />)}
        </ul>
      ) : (
        <div className="mt-4"><FinanceEmptyState title={emptyTitle} description={emptyDescription} /></div>
      )}
    </section>
  );
}
