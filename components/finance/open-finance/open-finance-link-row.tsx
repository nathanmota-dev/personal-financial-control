"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormSelect } from "@/components/finance/form-select";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { OpenFinanceLinkRowProps } from "@/lib/interfaces/components/open-finance";
import type { PluggyLinkDraft } from "@/lib/interfaces/pluggy";
import { isLinkableAccountType } from "@/lib/pluggy-account-rules";
import { pluggyAccountKindLabels, pluggyToday } from "@/lib/pluggy-ui";

export function OpenFinanceLinkRow({ row, accounts, busy, onSave }: OpenFinanceLinkRowProps) {
  const { link } = row;
  const [draft, setDraft] = useState<PluggyLinkDraft>({
    accountId: link?.accountId ?? "",
    cutoffDate: link?.cutoffDate ?? pluggyToday(),
    isEnabled: link?.isEnabled ?? true,
  });
  const options = accounts.filter((account) => account.id === draft.accountId || (!account.isArchived && isLinkableAccountType(row.kind, account.type)));
  const update = (changes: Partial<PluggyLinkDraft>) => setDraft((current) => ({ ...current, ...changes }));
  const fieldId = `open-finance-${row.externalAccountId}`;

  return (
    <div className="grid items-end gap-3 rounded-lg border border-border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p data-user-content className="truncate text-sm font-medium text-content-strong">{row.name}</p>
        <p className="text-xs text-content-muted">
          {pluggyAccountKindLabels[row.kind]}
          {row.numberSuffix ? <span data-user-content> · final {row.numberSuffix}</span> : null}
        </p>
        {link ? <Badge className="mt-1" variant="outline">{link.isEnabled ? "Vinculada" : "Desativada"}</Badge> : null}
      </div>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={`${fieldId}-account`}>Conta local de {row.name}</Label>
        <FormSelect id={`${fieldId}-account`} className="w-full" value={draft.accountId} placeholder="Selecione uma conta" onValueChange={(accountId) => update({ accountId })}>
          {options.map((account) => <SelectItem data-user-content key={account.id} value={account.id}>{account.name}</SelectItem>)}
        </FormSelect>
      </div>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={`${fieldId}-cutoff`}>Data de corte de {row.name}</Label>
        <DatePickerField id={`${fieldId}-cutoff`} value={draft.cutoffDate} required onDateChange={(cutoffDate) => update({ cutoffDate: cutoffDate ?? "" })} />
      </div>
      <div className="flex items-center gap-3">
        {link ? <Switch aria-label={`Sincronizar ${row.name}`} checked={draft.isEnabled} onCheckedChange={(isEnabled) => update({ isEnabled })} /> : null}
        <Button variant="outline" disabled={busy || !draft.accountId || !draft.cutoffDate} onClick={() => onSave(row, draft)}>{link ? "Salvar vínculo" : "Vincular conta"}</Button>
      </div>
    </div>
  );
}
