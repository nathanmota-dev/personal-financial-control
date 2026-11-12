"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/finance/form-select";
import { Label } from "@/components/ui/label";
import { SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OpenFinanceIdentityFieldsProps } from "@/lib/interfaces/components/open-finance";
import { isOtherOwnAccountType } from "@/lib/pluggy-account-rules";

export function OpenFinanceIdentityFields({ identity, accounts, saving, onSave }: OpenFinanceIdentityFieldsProps) {
  const [names, setNames] = useState(identity.names.join("\n"));
  const [cpf, setCpf] = useState("");
  const [otherOwnAccountId, setOtherOwnAccountId] = useState(identity.otherOwnAccountId ?? "");
  const options = accounts.filter((account) => account.id === otherOwnAccountId || (!account.isArchived && isOtherOwnAccountType(account.type)));

  function submit(event: FormEvent) {
    event.preventDefault();
    const list = names.split("\n").map((name) => name.trim()).filter(Boolean);
    onSave({ names: list, otherOwnAccountId: otherOwnAccountId || null, ...(cpf.trim() ? { cpf: cpf.trim() } : {}) });
    setCpf("");
  }

  return (
    <form className="grid items-start gap-3 md:grid-cols-3" onSubmit={submit}>
      <div className="space-y-1.5">
        <Label htmlFor="open-finance-owner-names">Nomes completos do titular</Label>
        <Textarea id="open-finance-owner-names" data-user-content rows={3} value={names} onChange={(event) => setNames(event.target.value)} />
        <p className="text-xs text-content-muted">Um por linha, como aparecem no banco.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="open-finance-owner-cpf">CPF do titular</Label>
        <Input id="open-finance-owner-cpf" inputMode="numeric" autoComplete="off" placeholder={identity.cpfMasked ?? "000.000.000-00"} value={cpf} onChange={(event) => setCpf(event.target.value)} />
        <p className="text-xs text-content-muted">{identity.cpfMasked ? "Deixe em branco para manter o CPF salvo." : "Usado só para reconhecer transferências próprias."}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="open-finance-other-account">Outras contas próprias</Label>
        <FormSelect id="open-finance-other-account" className="w-full" value={otherOwnAccountId || "none"} onValueChange={(value) => setOtherOwnAccountId(value === "none" ? "" : value)}>
          <SelectItem value="none">Nenhuma</SelectItem>
          {options.map((account) => <SelectItem data-user-content key={account.id} value={account.id}>{account.name}</SelectItem>)}
        </FormSelect>
        <p className="text-xs text-content-muted">Recebe transferências para contas suas que não estão vinculadas.</p>
      </div>
      <div className="md:col-span-3">
        <Button type="submit" variant="outline" disabled={saving}>{saving ? "Salvando…" : "Salvar identidade"}</Button>
      </div>
    </form>
  );
}
