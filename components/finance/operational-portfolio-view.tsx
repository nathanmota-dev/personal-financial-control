"use client";

import { InvestmentPositionRow } from "@/components/finance/investment-position-row";
import { InvestmentClassDistribution } from "@/components/finance/investment-class-distribution";
import { OperationalPortfolioHero } from "@/components/finance/operational-portfolio-hero";
import { buildAssetClassDistribution } from "@/lib/investment-class-distribution";

import { Plus, RefreshCw, Search, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo,useState,useTransition } from "react";
import { toast } from "sonner";

import { createOperationalInvestmentAssetAction,refreshInvestmentQuotesAction } from "@/app/actions/finance";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select";
import { investmentAssetClassLabels } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { useDatabaseSync } from "@/lib/database-sync-context";
import type { AssetFormState,OperationalPortfolioViewProps } from "@/lib/interfaces/investment-operations";

const initialForm: AssetFormState = { name: "", ticker: "", institutionName: "", assetClass: "equities", instrumentType: "stock", valuationMode: "market_quote", quoteSymbol: "" };
const headerButtonClassName = "h-10 gap-[10px] rounded-[10px] text-[13px] font-medium";
const supportedTypes = [
  { value: "stock", label: "Ação" }, { value: "real_estate_fund", label: "FII" }, { value: "etf", label: "ETF" },
  { value: "treasury", label: "Tesouro" }, { value: "cdb", label: "CDB" }, { value: "lci", label: "LCI" }, { value: "lca", label: "LCA" },
] as const;

export function OperationalPortfolioView({ positions }: OperationalPortfolioViewProps) {
  const { canWrite } = useDatabaseSync();
  const { formatCurrency } = useFinancialFormatter();
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
  const filteredTotal = filtered.reduce((sum, item) => sum + item.currentValueCents, 0);

  function submit() {
    startTransition(async () => {
      const result = await createOperationalInvestmentAssetAction({ ...form, type, ticker: form.ticker || null, institutionName: form.institutionName || null, quoteSymbol: form.quoteSymbol || form.ticker || null });
      if (!result.ok) { toast.error(result.error.message); return; }
      toast.success("Ativo cadastrado. Registre a primeira operação.");
      setOpen(false); setForm(initialForm); router.refresh();
    });
  }

  function refreshQuotes() {
    if (!canWrite) { toast.error("Reconecte para atualizar as cotações."); return; }
    startTransition(async () => {
      const result = await refreshInvestmentQuotesAction();
      if (!result.ok) { toast.error(result.error.message); return; }
      toast.success(`${result.data.updated} cotação(ões) atualizada(s); ${result.data.failed} falha(s).`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader eyebrow="Carteira" title="Carteira" description="Ações, FIIs, ETFs e renda fixa acompanhados por operações. A reserva fica fora desta visão." actions={<div className="flex flex-wrap gap-3"><Button variant="secondary" className={headerButtonClassName} disabled={pending} onClick={refreshQuotes}><RefreshCw className={`size-[17px] ${pending ? "animate-spin" : ""}`} /> Atualizar cotações</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className={headerButtonClassName}><Plus className="size-[17px]" /> Cadastrar ativo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader icon={<Landmark />} tone="violet"><DialogTitle>Novo ativo</DialogTitle><DialogDescription>A posição nasce das operações registradas.</DialogDescription></DialogHeader>
            <div className="grid gap-4">
              <Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Nome<Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Label>
              <div className="grid grid-cols-2 gap-3"><Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Código<Input value={form.ticker} onChange={(event) => setForm({ ...form, ticker: event.target.value.toUpperCase() })} /></Label><Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Instituição<Input value={form.institutionName} onChange={(event) => setForm({ ...form, institutionName: event.target.value })} /></Label></div>
              <Label className="grid min-w-0 gap-2 [&>input]:font-normal [&>button]:w-full">Tipo de ativo<Select value={type} onValueChange={(value) => setType(value as typeof type)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{supportedTypes.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></Label>
              <Button disabled={pending || !form.name.trim()} onClick={submit}>{pending ? "Salvando..." : "Criar ativo"}</Button>
            </div>
          </DialogContent>
        </Dialog></div>
      } />
      <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
        <OperationalPortfolioHero positions={positions} />
        <InvestmentClassDistribution
          title="Alocação por classe"
          description="Participação de cada classe no valor atual"
          items={buildAssetClassDistribution(positions)}
          emptyMessage="Cadastre um ativo para ver a alocação por classe."
          illustrationSrc="/images/expenses-pie.webp"
        />
      </div>
      <section aria-label="Posições" className="min-w-0 overflow-hidden rounded-[20px] border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 px-[22px] pt-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold leading-[25px]">Posições</h2>
              <Badge variant="outline" className="border-input text-content">{filtered.length}</Badge>
            </div>
            <p className="mt-1 text-xs text-content-muted">Selecione um ativo para ver operações, custo e resultado</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-content-subtle">Total filtrado</p>
            <p className="text-xl font-semibold tabular-nums text-content-strong">{formatCurrency(filteredTotal)}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 border-b border-border px-[22px] pb-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative"><Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-content-muted" /><Input className="h-10 rounded-[10px] pl-9" placeholder="Buscar ativo, código ou instituição" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <Select value={assetClass} onValueChange={setAssetClass}><SelectTrigger className="h-10 w-full rounded-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as classes</SelectItem>{Object.entries(investmentAssetClassLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        </div>
        {filtered.length ? (
          <ul className="divide-y divide-border">{filtered.map((item) => <InvestmentPositionRow key={item.id} item={item} />)}</ul>
        ) : (
          <p className="px-[22px] py-12 text-center text-sm text-content-muted">Nenhuma posição encontrada.</p>
        )}
      </section>
    </div>
  );
}
