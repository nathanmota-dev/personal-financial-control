import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OpenFinanceSetupNotice() {
  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Open Finance não configurado</CardTitle>
        <CardDescription>O restante do app continua funcionando normalmente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-content-muted">
        <p>Para conectar seus bancos, preencha <code>PLUGGY_CLIENT_ID</code> e <code>PLUGGY_CLIENT_SECRET</code> no arquivo <code>.env</code> e reinicie o app.</p>
        <p>O passo a passo está em <code>docs/open-finance.md</code>.</p>
      </CardContent>
    </Card>
  );
}
