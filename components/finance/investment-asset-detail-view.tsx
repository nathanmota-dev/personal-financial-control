"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createInvestmentOperationAction, deleteInvestmentOperationAction, registerManualInvestmentQuoteAction, updateManualInvestmentBalanceAction } from "@/app/actions/finance";
import { financeMetricClassName, financePanelClassName } from "@/components/finance/finance-styles";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateLabel, moneyInputToCents } from "@/lib/finance-ui";
import type { DetailMetricProps, InvestmentAssetDetailViewProps, OperationFormState } from "@/lib/interfaces/investment-operations";

const operationLabels = { buy: "Compra", sell: "Venda", application: "Aplicação", redemption: "Resgate", correction: "Correção" };
const today = () => new Date().toISOString().slice(0, 10);

export function InvestmentAssetDetailView({ asset }: InvestmentAssetDetailViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [operationOpen, setOperationOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [operation, setOperation] = useState<OperationFormState>({ type: asset.assetClass === "fixed_income" ? "application" : "buy", operatedOn: today(), quantity: "", grossAmount: "", fees: "", notes: "" });
  const [currentValue, setCurrentValue] = useState("");

  function submitOperation() {
    startTransition(async () => {
      const result = await createInvestmentOperationAction({ holdingId: asset.id, type: operation.type, operatedOn: operation.operatedOn, quantity: operation.quantity || "0", grossAmountCents: moneyInputToCents(operation.grossAmount), feesCents: operation.fees ? moneyInputToCents(operation.fees) : 0, notes: operation.notes || null });
      if (!result.ok) { toast.error(result.error.message); return; }
      toast.success("Operação registrada e posição recalculada."); setOperationOpen(false); router.refresh();
    });
  }
  function submitValue() {
    startTransition(async () => {
      const input = { holdingId: asset.id, unitPriceCents: moneyInputToCents(currentValue), quotedOn: today() };
      const result = asset.valuationMode === "market_quote" ? await registerManualInvestmentQuoteAction(input) : await updateManualInvestmentBalanceAction({ holdingId: asset.id, currentValueCents: input.unitPriceCents, valueAsOf: input.quotedOn });
      if (!result.ok) { toast.error(result.error.message); return; }
      toast.success(asset.valuationMode === "market_quote" ? "Cotação atualizada." : "Saldo atualizado."); setUpdateOpen(false); router.refresh();
    });
  }
  function removeOperation(id: string) {
    if (!window.confirm("Excluir esta operação e recalcular todo o histórico?")) return;
    startTransition(async () => { const result = await deleteInvestmentOperationAction(id); if (!result.ok) toast.error(result.error.message); else { toast.success("Operação excluída."); router.refresh(); } });
  }

  return <div className="space-y-6">
    <PageHeader eyebrow={asset.ticker ?? "Ativo"} title={asset.name} description={`${asset.institutionName ?? "Instituição não informada"} · posição atualizada em ${formatDateLabel(asset.valueAsOf)}`} actions={<><Button asChild variant="outline"><Link href="/investments/portfolio"><ArrowLeft className="size-4" /> Carteira</Link></Button><Dialog open={updateOpen} onOpenChange={setUpdateOpen}><DialogTrigger asChild><Button variant="outline"><RefreshCw className="size-4" /> {asset.valuationMode === "market_quote" ? "Cotação" : "Saldo"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Atualizar {asset.valuationMode === "market_quote" ? "cotação" : "saldo"}</DialogTitle><DialogDescription>O valor será registrado com a data de hoje.</DialogDescription></DialogHeader><Label>Valor em reais<Input value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} placeholder="0,00" /></Label><Button disabled={pending || !currentValue} onClick={submitValue}>Salvar atualização</Button></DialogContent></Dialog><Dialog open={operationOpen} onOpenChange={setOperationOpen}><DialogTrigger asChild><Button><Plus className="size-4" /> Operação</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Registrar operação</DialogTitle><DialogDescription>O histórico inteiro será recalculado pelo preço médio móvel.</DialogDescription></DialogHeader><div className="grid gap-4"><Label>Tipo<Select value={operation.type} onValueChange={(value) => setOperation({ ...operation, type: value as OperationFormState["type"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(operationLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Label><Label>Data<Input type="date" value={operation.operatedOn} onChange={(event) => setOperation({ ...operation, operatedOn: event.target.value })} /></Label>{!["application", "redemption"].includes(operation.type) ? <Label>Quantidade (até 8 casas)<Input inputMode="decimal" value={operation.quantity} onChange={(event) => setOperation({ ...operation, quantity: event.target.value.replace(",", ".") })} /></Label> : null}<Label>Valor bruto<Input value={operation.grossAmount} onChange={(event) => setOperation({ ...operation, grossAmount: event.target.value })} placeholder="0,00" /></Label><Label>Taxas<Input value={operation.fees} onChange={(event) => setOperation({ ...operation, fees: event.target.value })} placeholder="0,00" /></Label><Label>Observação<Input value={operation.notes} onChange={(event) => setOperation({ ...operation, notes: event.target.value })} /></Label><Button disabled={pending || !operation.grossAmount} onClick={submitOperation}>{pending ? "Recalculando..." : "Registrar"}</Button></div></DialogContent></Dialog></>} />
    <section className="grid gap-4 md:grid-cols-4"><DetailMetric label="Valor atual" value={formatCurrency(asset.currentValueCents)} /><DetailMetric label="Quantidade" value={asset.position?.quantity ?? "Não informada"} /><DetailMetric label="Custo" value={asset.position ? formatCurrency(asset.position.costCents) : "Não informado"} /><DetailMetric label="Resultado" value={asset.resultCents === null ? "Não informado" : formatCurrency(asset.resultCents)} tone={asset.resultCents !== null && asset.resultCents < 0 ? "negative" : "positive"} /></section>
    <section className={`${financePanelClassName} overflow-hidden`}><div className="border-b border-border p-5"><h2 className="text-lg font-semibold text-content-strong">Histórico operacional</h2><p className="mt-1 text-sm text-content-muted">Compras, vendas, aplicações, resgates e correções.</p></div><div className="divide-y divide-border">{asset.operations.length ? asset.operations.map((item) => <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[1fr_.7fr_.7fr_auto] md:items-center"><div><p className="font-medium text-content-strong">{operationLabels[item.type]}</p><p className="mt-1 text-xs text-content-muted">{formatDateLabel(item.operatedOn)}{item.notes ? ` · ${item.notes}` : ""}</p></div><p className="font-mono text-sm">{item.quantityUnits ? `${item.quantityUnits / 100_000_000} un.` : "—"}</p><p className="font-mono text-sm text-content-strong">{formatCurrency(item.grossAmountCents)}</p><Button size="icon-sm" variant="ghost" disabled={pending} onClick={() => removeOperation(item.id)} aria-label="Excluir operação"><Trash2 className="size-4" /></Button></div>) : <p className="p-10 text-center text-sm text-content-muted">Nenhuma operação registrada.</p>}</div></section>
  </div>;
}

function DetailMetric({ label, value, tone = "neutral" }: DetailMetricProps) {
  return <div className={`${financeMetricClassName} p-5`}><p className="text-xs uppercase tracking-wider text-content-muted">{label}</p><p className={`mt-3 text-xl font-semibold ${tone === "positive" ? "text-emerald-300" : tone === "negative" ? "text-rose-300" : "text-content-strong"}`}>{value}</p></div>;
}
