"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { createOperationalInvestmentAssetAction, refreshInvestmentQuotesAction } from "@/app/actions/finance";
import { financePanelClassName } from "@/components/finance/finance-styles";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, investmentAssetClassLabels } from "@/lib/finance-ui";
import type { AssetFormState, OperationalPortfolioViewProps } from "@/lib/interfaces/investment-operations";

const initialForm: AssetFormState = { name: "", ticker: "", institutionName: "", assetClass: "equities", instrumentType: "stock", valuationMode: "market_quote", quoteSymbol: "" };
const supportedTypes = [
  { value: "stock", label: "Ação" }, { value: "real_estate_fund", label: "FII" }, { value: "etf", label: "ETF" },
  { value: "treasury", label: "Tesouro" }, { value: "cdb", label: "CDB" }, { value: "lci", label: "LCI" }, { value: "lca", label: "LCA" },
] as const;

export function OperationalPortfolioView({ positions }: OperationalPortfolioViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [assetClass, setAssetClass] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<(typeof supportedTypes)[number]["value"]>("stock");
  const filtered = useMemo(() => positions.filter((item) => {
    const text = `${item.name} ${item.ticker ?? ""} ${item.institutionName ?? ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (assetClass === "all" || item.assetClass === assetClass);
  }), [positions, query, assetClass]);
  const total = positions.reduce((sum, item) => sum + item.currentValueCents, 0);

  function submit() {
    startTransition(async () => {
      const result = await createOperationalInvestmentAssetAction({ ...form, type, ticker: form.ticker || null, institutionName: form.institutionName || null, quoteSymbol: form.quoteSymbol || form.ticker || null });
      if (!result.ok) { toast.error(result.error.message); return; }
      toast.success("Ativo cadastrado. Registre a primeira operação.");
      setOpen(false); setForm(initialForm); router.refresh();
    });
  }

  function refreshQuotes() {
    startTransition(async () => {
      const result = await refreshInvestmentQuotesAction();
      if (!result.ok) { toast.error(result.error.message); return; }
      toast.success(`${result.data.updated} cotação(ões) atualizada(s); ${result.data.failed} falha(s).`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Carteira de longo prazo" title="Posições operacionais" description="Ações, FIIs, ETFs e renda fixa acompanhados por operações. A reserva fica fora desta visão." actions={<div className="flex gap-2"><Button variant="outline" disabled={pending} onClick={refreshQuotes}><RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} /> Atualizar cotações</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> Cadastrar ativo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo ativo</DialogTitle><DialogDescription>A posição nasce das operações registradas.</DialogDescription></DialogHeader>
            <div className="grid gap-4">
              <Label>Nome<Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Label>
              <div className="grid grid-cols-2 gap-3"><Label>Código<Input value={form.ticker} onChange={(event) => setForm({ ...form, ticker: event.target.value.toUpperCase() })} /></Label><Label>Instituição<Input value={form.institutionName} onChange={(event) => setForm({ ...form, institutionName: event.target.value })} /></Label></div>
              <Label>Tipo de ativo<Select value={type} onValueChange={(value) => setType(value as typeof type)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{supportedTypes.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></Label>
              <Button disabled={pending || !form.name.trim()} onClick={submit}>{pending ? "Salvando..." : "Criar ativo"}</Button>
            </div>
          </DialogContent>
        </Dialog></div>
      } />
      <section className={`${financePanelClassName} overflow-hidden`}>
        <div className="grid gap-4 border-b border-border p-5 md:grid-cols-[1fr_220px_auto] md:items-center">
          <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-muted" /><Input className="pl-9" placeholder="Buscar ativo, código ou instituição" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <Select value={assetClass} onValueChange={setAssetClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as classes</SelectItem>{Object.entries(investmentAssetClassLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          <div className="rounded-xl border border-border px-4 py-2 text-right"><p className="text-[10px] uppercase text-content-muted">Total</p><p className="font-semibold text-cyan-300">{formatCurrency(total)}</p></div>
        </div>
        <div className="divide-y divide-border">{filtered.length ? filtered.map((item) => (
          <Link key={item.id} href={`/investments/assets/${item.id}`} className="grid gap-3 p-5 transition hover:bg-cyan-400/[.04] md:grid-cols-[1.3fr_.7fr_.7fr_.5fr_auto] md:items-center">
            <div><strong className="text-content-strong">{item.name}</strong><p className="mt-1 text-xs text-content-muted">{item.ticker ?? "Sem código"} · {item.institutionName ?? "Instituição não informada"}</p></div>
            <div><p className="text-[10px] uppercase text-content-muted">Valor atual</p><p className="font-mono text-sm">{formatCurrency(item.currentValueCents)}</p></div>
            <div><p className="text-[10px] uppercase text-content-muted">Resultado</p><p className={item.resultCents === null ? "text-content-muted" : item.resultCents >= 0 ? "text-emerald-300" : "text-rose-300"}>{item.resultCents === null ? "Custo não informado" : formatCurrency(item.resultCents)}</p></div>
            <div><p className="text-[10px] uppercase text-content-muted">Participação</p><p className="font-mono text-sm">{item.participationPercentage.toFixed(1)}%</p></div><ArrowRight className="size-4 text-content-muted" />
          </Link>
        )) : <div className="p-12 text-center text-sm text-content-muted">Nenhuma posição encontrada.</div>}</div>
      </section>
    </div>
  );
}
