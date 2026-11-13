"use client";

import { Banknote, Landmark, Pencil, PiggyBank, Wallet } from "lucide-react";

import { ArchiveAccountButton } from "@/components/finance/archive-account-button";
import { IconTile } from "@/components/finance/ds/icon-tile";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { AccountSetupDialog } from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import { accountTypeLabels } from "@/lib/finance-ui";
import type { SettingsAccountRowProps } from "@/lib/interfaces/settings";
import { cn } from "@/lib/utils";

const typeIcons = { checking: Wallet, savings: PiggyBank, cash: Banknote, investment: Landmark, credit: Wallet };
const typeTones = { checking: "brand", savings: "success", cash: "warning", investment: "violet", credit: "brand" } as const;

export function SettingsAccountRow({ account, allowedTypes }: SettingsAccountRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const Icon = typeIcons[account.type];
  return (
    <li aria-label={account.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3.5 md:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:gap-x-4">
      <IconTile tone={typeTones[account.type]} className={cn(account.isArchived && "opacity-60")}><Icon /></IconTile>
      <div className={cn("min-w-0", account.isArchived && "opacity-70")}>
        <p data-user-content className="truncate text-[13px] font-semibold text-content-strong">{account.name}</p>
        <p className="flex items-center gap-2 text-xs text-content-muted">
          {accountTypeLabels[account.type]}
          {account.isArchived ? <ToneChip tone="neutral" className="h-5 px-1.5 text-[11px]">Arquivada</ToneChip> : null}
        </p>
      </div>
      <div className="col-start-3 flex justify-end gap-1 md:order-5 md:col-start-auto">
        <AccountSetupDialog
          account={account}
          allowedTypes={allowedTypes}
          trigger={<Button variant="ghost" size="icon-sm" aria-label="Editar" title="Editar"><Pencil className="size-4" /></Button>}
        />
        {!account.isArchived ? <ArchiveAccountButton id={account.id} /> : null}
      </div>
      <div className="col-start-2 md:col-start-auto md:text-right">
        <p className="text-[11px] text-content-muted">Saldo inicial</p>
        <p className="text-[13px] tabular-nums text-content">{formatCurrency(account.initialBalanceCents)}</p>
      </div>
      <div className="col-start-2 md:col-start-auto md:text-right">
        <p className="text-[11px] text-content-muted">Saldo atual</p>
        <p className={cn("text-[13px] font-semibold tabular-nums", account.currentBalanceCents < 0 ? "text-destructive" : "text-content-strong")}>{formatCurrency(account.currentBalanceCents)}</p>
      </div>
    </li>
  );
}
