"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OpenFinanceItemFormProps } from "@/lib/interfaces/components/open-finance";

export function OpenFinanceItemForm({ busy, onAdd }: OpenFinanceItemFormProps) {
  const [label, setLabel] = useState("");
  const [externalItemId, setExternalItemId] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await onAdd(externalItemId.trim(), label.trim())) {
      setLabel("");
      setExternalItemId("");
    }
  }

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Adicionar banco</CardTitle>
        <CardDescription>A Pluggy identifica toda conexão como MeuPluggy, então escolha um nome para o banco.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="open-finance-label">Nome do banco</Label>
            <Input id="open-finance-label" value={label} maxLength={60} required onChange={(event) => setLabel(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="open-finance-item-id">Item ID</Label>
            <Input id="open-finance-item-id" value={externalItemId} maxLength={100} required autoComplete="off" onChange={(event) => setExternalItemId(event.target.value)} />
          </div>
          <Button type="submit" variant="outline" disabled={busy || !label.trim() || !externalItemId.trim()}>Adicionar conexão</Button>
        </form>
      </CardContent>
    </Card>
  );
}
