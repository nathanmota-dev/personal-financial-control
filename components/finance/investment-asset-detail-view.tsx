"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createInvestmentOperationAction, deleteInvestmentOperationAction, registerManualInvestmentQuoteAction, updateInvestmentOperationAction, updateManualInvestmentBalanceAction } from "@/app/actions/finance";
import { financePanelClassName } from "@/components/finance/finance-styles";
import { InvestmentDetailMetric as Metric } from "@/components/finance/investment-detail-metric";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateLabel, moneyInputToCents } from "@/lib/finance-ui";
import type { InvestmentAssetDetailViewProps, OperationFormState } from "@/lib/interfaces/investment-operations";

const labels = { buy: "Compra", sell: "Venda", application: "Aplicação", redemption: "Resgate", correction: "Correção" };
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (fixed: boolean): OperationFormState => ({ type: fixed ? "application" : "buy", operatedOn: today(), quantity: "", unitPrice: "", grossAmount: "", fees: "", notes: "" });

export function InvestmentAssetDetailView({ asset }: InvestmentAssetDetailViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [operationOpen, setOperationOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [operation, setOperation] = useState<OperationFormState>(emptyForm(asset.assetClass === "fixed_income"));
  const [currentValue, setCurrentValue] = useState("");
  const quoted = ["buy", "sell"].includes(operation.type);
  const operationTypes = asset.assetClass === "fixed_income" ? ["application", "redemption", "correction"] : ["buy", "sell", "correction"];

  function openNewOperation() { setEditingId(null); setOperation(emptyForm(asset.assetClass === "fixed_income")); setOperationOpen(true); }
  function openEdit(item: typeof asset.operations[number]) {
    setEditingId(item.id);
    setOperation({ type: item.type, operatedOn: item.operatedOn, quantity: String(item.quantityUnits / 100_000_000), unitPrice: item.unitPriceCents == null ? "" : String(item.unitPriceCents / 100), grossAmount: String(item.grossAmountCents / 100), fees: String(item.feesCents / 100), notes: item.notes ?? "" });
    setOperationOpen(true);
  }
  function submitOperation() {
    startTransition(async () => {
      const input = { holdingId: asset.id, type: operation.type, operatedOn: operation.operatedOn, quantity: operation.quantity || "0", unitPriceCents: quoted ? moneyInputToCents(operation.unitPrice) : null, grossAmountCents: quoted ? undefined : moneyInputToCents(operation.grossAmount), targetCostCents: operation.type === "correction" ? moneyInputToCents(operation.grossAmount) : null, feesCents: operation.fees ? moneyInputToCents(operation.fees) : 0, notes: operation.notes || null };
      const result = editingId ? await updateInvestmentOperationAction(editingId, input) : await createInvestmentOperationAction(input);
      if (!result.ok) { toast.error(result.error.message); return; }
      toast.success(editingId ? "Operação atualizada." : "Operação registrada."); setOperationOpen(false); router.refresh();
    });
  }
  function submitValue() {
    startTransition(async () => {
      const cents = moneyInputToCents(currentValue);
      const result = asset.valuationMode === "market_quote" ? await registerManualInvestmentQuoteAction({ holdingId: asset.id, unitPriceCents: cents, quotedOn: today() }) : await updateManualInvestmentBalanceAction({ holdingId: asset.id, currentValueCents: cents, valueAsOf: today() });
      if (!result.ok) { toast.error(result.error.message); return; }
      toast.success("Valoração atualizada."); setUpdateOpen(false); router.refresh();
    });
  }
  function removeOperation(id: string) {
    if (!window.confirm("Excluir esta operação e recalcular o histórico?")) return;
    startTransition(async () => { const result = await deleteInvestmentOperationAction(id); if (!result.ok) toast.error(result.error.message); else { toast.success("Operação excluída."); router.refresh(); } });
  }

  const quote = asset.quotes[0];
  return <div className="space-y-6">
    <PageHeader eyebrow={asset.ticker ?? "Ativo"} title={asset.name} description={`${asset.institutionName ?? "Instituição não informada"} · atualizado em ${formatDateLabel(asset.valueAsOf)}${quote ? ` · ${quote.provider}${quote.isStale ? " (desatualizada)" : ""}` : ""}`} actions={<div className="flex gap-2"><Button asChild variant="outline"><Link href="/investments/portfolio"><ArrowLeft className="size-4" /> Carteira</Link></Button><Button variant="outline" onClick={() => setUpdateOpen(true)}><RefreshCw className="size-4" /> {asset.valuationMode === "market_quote" ? "Cotação" : "Saldo"}</Button><Button onClick={openNewOperation}><Plus className="size-4" /> Operação</Button></div>} />
    <section className="grid gap-4 md:grid-cols-4"><Metric label="Valor atual" value={formatCurrency(asset.currentValueCents)} /><Metric label="Quantidade" value={asset.position?.quantity ?? "Desconhecida"} /><Metric label="Custo / preço médio" value={asset.position ? `${formatCurrency(asset.position.costCents)} · ${asset.position.averagePriceCents ? formatCurrency(asset.position.averagePriceCents) : "—"}` : "Desconhecido"} /><Metric label="Resultado nominal" value={asset.resultCents === null ? "Desconhecido" : formatCurrency(asset.resultCents)} tone={asset.resultCents !== null && asset.resultCents < 0 ? "negative" : "positive"} /></section>
    <section className={`${financePanelClassName} overflow-hidden`}><div className="border-b border-border p-5"><h2 className="text-lg font-semibold text-content-strong">Histórico operacional</h2><p className="mt-1 text-sm text-content-muted">Em renda fixa, o resultado é nominal e não considera impostos.</p></div><div className="divide-y divide-border">{asset.operations.length ? asset.operations.map((item) => <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[1fr_.7fr_.7fr_auto] md:items-center"><div><p className="font-medium text-content-strong">{labels[item.type]}</p><p className="mt-1 text-xs text-content-muted">{formatDateLabel(item.operatedOn)}{item.notes ? ` · ${item.notes}` : ""}</p></div><p className="font-mono text-sm">{item.quantityUnits ? `${item.quantityUnits / 100_000_000} un.` : "—"}</p><p className="font-mono text-sm">{formatCurrency(item.grossAmountCents)}</p><div><Button size="icon-sm" variant="ghost" onClick={() => openEdit(item)}><Pencil className="size-4" /></Button><Button size="icon-sm" variant="ghost" onClick={() => removeOperation(item.id)}><Trash2 className="size-4" /></Button></div></div>) : <p className="p-10 text-center text-sm text-content-muted">Sem operações: custo, resultado e rentabilidade permanecem desconhecidos.</p>}</div></section>
    <Dialog open={updateOpen} onOpenChange={setUpdateOpen}><DialogContent><DialogHeader><DialogTitle>Atualizar valoração</DialogTitle><DialogDescription>Cotação manual como fallback ou saldo atual da renda fixa.</DialogDescription></DialogHeader><Label>Valor em reais<Input value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} placeholder="0,00" /></Label><Button disabled={pending || !currentValue} onClick={submitValue}>Salvar</Button></DialogContent></Dialog>
    <Dialog open={operationOpen} onOpenChange={setOperationOpen}><DialogContent><DialogHeader><DialogTitle>{editingId ? "Editar" : "Registrar"} operação</DialogTitle><DialogDescription>O histórico será validado e recalculado atomicamente.</DialogDescription></DialogHeader><div className="grid gap-4"><Label>Tipo<Select value={operation.type} onValueChange={(type) => setOperation({ ...operation, type: type as OperationFormState["type"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{operationTypes.map((type) => <SelectItem key={type} value={type}>{labels[type as keyof typeof labels]}</SelectItem>)}</SelectContent></Select></Label><Label>Data<Input type="date" value={operation.operatedOn} onChange={(event) => setOperation({ ...operation, operatedOn: event.target.value })} /></Label>{!["application", "redemption"].includes(operation.type) ? <Label>Quantidade<Input value={operation.quantity} onChange={(event) => setOperation({ ...operation, quantity: event.target.value.replace(",", ".") })} /></Label> : null}{quoted ? <Label>Preço unitário<Input value={operation.unitPrice} onChange={(event) => setOperation({ ...operation, unitPrice: event.target.value })} placeholder="0,00" /></Label> : <Label>{operation.type === "correction" ? "Custo alvo" : "Valor bruto"}<Input value={operation.grossAmount} onChange={(event) => setOperation({ ...operation, grossAmount: event.target.value })} placeholder="0,00" /></Label>}<Label>Taxas<Input value={operation.fees} onChange={(event) => setOperation({ ...operation, fees: event.target.value })} /></Label><Label>Observação<Input value={operation.notes} onChange={(event) => setOperation({ ...operation, notes: event.target.value })} /></Label><Button disabled={pending || !(quoted ? operation.unitPrice : operation.grossAmount)} onClick={submitOperation}>Salvar operação</Button></div></DialogContent></Dialog>
  </div>;
}
