"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { MoneyInput } from "@/components/finance/money-input";

import { ArrowLeft, Plus, RefreshCw, LineChart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState,useTransition } from "react";
import { toast } from "sonner";

import { createInvestmentOperationAction,deleteInvestmentOperationAction,registerManualInvestmentQuoteAction,updateInvestmentOperationAction,updateManualInvestmentBalanceAction } from "@/app/actions/finance";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { InvestmentAssetHero } from "@/components/finance/investment-asset-hero";
import { InvestmentAssetResult } from "@/components/finance/investment-asset-result";
import { InvestmentOperationRow } from "@/components/finance/investment-operation-row";
import { PageHeader } from "@/components/finance/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog,DialogDescription,DialogFooter,DialogHeader,DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select";
import { formatDateLabel, moneyInputToCents } from "@/lib/finance-ui";
import { INVESTMENT_ASSET_ILLUSTRATIONS } from "@/lib/investment-asset-illustrations";
import type { InvestmentAssetDetailViewProps,OperationFormState } from "@/lib/interfaces/investment-operations";

const labels = { buy: "Compra", sell: "Venda", application: "Aplicação", redemption: "Resgate", correction: "Correção" };
const today = () => new Date().toISOString().slice(0, 10);
const headerButtonClassName = "h-10 gap-[10px] rounded-[10px] text-[13px] font-medium";
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
  return <div className="space-y-6 min-[100.0625rem]:space-y-5">
    <PageHeader eyebrow={asset.ticker ?? "Ativo"} title={asset.name} description={`${asset.institutionName ?? "Instituição não informada"} · atualizado em ${formatDateLabel(asset.valueAsOf)}${quote ? ` · ${quote.provider}${quote.isStale ? " (desatualizada)" : ""}` : ""}`} actions={<div className="flex flex-wrap gap-3"><Button asChild variant="secondary" className={headerButtonClassName}><Link href="/investments/portfolio"><ArrowLeft className="size-[17px]" /> Carteira</Link></Button><Button variant="secondary" className={headerButtonClassName} onClick={() => setUpdateOpen(true)}><RefreshCw className="size-[17px]" /> {asset.valuationMode === "market_quote" ? "Cotação" : "Saldo"}</Button><Button className={headerButtonClassName} onClick={openNewOperation}><Plus className="size-[17px]" /> Operação</Button></div>} />
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <InvestmentAssetHero asset={asset} />
      <InvestmentAssetResult asset={asset} />
    </div>
    <section aria-label="Histórico operacional" className="relative min-w-0 overflow-hidden rounded-[20px] border border-border bg-card">
      <DashboardCardIllustration src={INVESTMENT_ASSET_ILLUSTRATIONS.history} />
      <div className="px-[22px] pt-5 pb-4 pr-24">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold leading-[25px]">Histórico operacional</h2>
          <Badge variant="outline" className="border-input text-content">{asset.operations.length}</Badge>
        </div>
        <p className="mt-1 text-xs text-content-muted">Em renda fixa, o resultado é nominal e não considera impostos.</p>
      </div>
      <div className="divide-y divide-border border-t border-border">
        {asset.operations.length ? asset.operations.map((item) => <InvestmentOperationRow key={item.id} item={item} label={labels[item.type]} onEdit={() => openEdit(item)} onRemove={() => removeOperation(item.id)} />) : <div className="p-[22px]"><FinanceEmptyState title="Nenhuma operação registrada" description="Sem operações: custo, resultado e rentabilidade permanecem desconhecidos." action={<Button className={headerButtonClassName} onClick={openNewOperation}><Plus className="size-[17px]" /> Registrar operação</Button>} /></div>}
      </div>
    </section>
    <Dialog open={updateOpen} onOpenChange={setUpdateOpen}><DialogContent><DialogHeader icon={<LineChart />} tone="violet"><DialogTitle>Atualizar valoração</DialogTitle><DialogDescription>Cotação manual como fallback ou saldo atual da renda fixa.</DialogDescription></DialogHeader><Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Valor em reais<MoneyInput value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} placeholder="0,00" /></Label><DialogFooter><Button disabled={pending || !currentValue} onClick={submitValue}>Salvar</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={operationOpen} onOpenChange={setOperationOpen}><DialogContent><DialogHeader icon={<LineChart />} tone="violet"><DialogTitle>{editingId ? "Editar" : "Registrar"} operação</DialogTitle><DialogDescription>Informe os dados da operação para atualizar a posição e o histórico do ativo.</DialogDescription></DialogHeader><div className="grid gap-4"><Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Tipo<Select value={operation.type} onValueChange={(type) => setOperation({ ...operation, type: type as OperationFormState["type"] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{operationTypes.map((type) => <SelectItem key={type} value={type}>{labels[type as keyof typeof labels]}</SelectItem>)}</SelectContent></Select></Label><Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Data<Input type="date" value={operation.operatedOn} onChange={(event) => setOperation({ ...operation, operatedOn: event.target.value })} /></Label>{!["application", "redemption"].includes(operation.type) ? <Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Quantidade<Input value={operation.quantity} onChange={(event) => setOperation({ ...operation, quantity: event.target.value.replace(",", ".") })} /></Label> : null}{quoted ? <Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Preço unitário<MoneyInput value={operation.unitPrice} onChange={(event) => setOperation({ ...operation, unitPrice: event.target.value })} placeholder="0,00" /></Label> : <Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">{operation.type === "correction" ? "Custo alvo" : "Valor bruto"}<MoneyInput value={operation.grossAmount} onChange={(event) => setOperation({ ...operation, grossAmount: event.target.value })} placeholder="0,00" /></Label>}<Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Taxas<MoneyInput value={operation.fees} onChange={(event) => setOperation({ ...operation, fees: event.target.value })} /></Label><Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Observação<Input value={operation.notes} onChange={(event) => setOperation({ ...operation, notes: event.target.value })} /></Label><Button disabled={pending || !(quoted ? operation.unitPrice : operation.grossAmount)} onClick={submitOperation}>Salvar operação</Button></div></DialogContent></Dialog>
  </div>;
}
