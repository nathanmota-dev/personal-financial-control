"use client";

import { OpenFinanceIdentityFields } from "@/components/finance/open-finance/open-finance-identity-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpenFinanceIdentity } from "@/hooks/use-open-finance-identity";
import type { OpenFinanceIdentityCardProps } from "@/lib/interfaces/components/open-finance";

export function OpenFinanceIdentityCard({ accounts }: OpenFinanceIdentityCardProps) {
  const { identity, saving, saved, error, save } = useOpenFinanceIdentity();
  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Identidade do titular</CardTitle>
        <CardDescription>Evita que transferências entre as suas contas virem receita ou despesa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {identity ? <OpenFinanceIdentityFields identity={identity} accounts={accounts} saving={saving} onSave={save} /> : null}
        {saved ? <p role="status" className="text-sm text-content-muted">Identidade salva.</p> : null}
      </CardContent>
    </Card>
  );
}
