"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calculator, PiggyBank, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { saveInvestmentPortfolioAction } from "@/app/actions/finance";
import { InlineWarning } from "@/components/finance/inline-warning";
import { InvestmentsActions } from "@/components/finance/investments-actions";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  centsToMoneyInput,
  extractErrorMessage,
  formatCurrency,
  formatDateLabel,
  formatRateFromBps,
  moneyInputToCents,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

type Projection = {
  id: string;
  currentBalanceCents: number;
  monthlyContributionCents: number;
  expectedMonthlyRateBps: number;
  referenceDate: string;
  projection: Record<number, number>;
} | null;

export function InvestmentsView({
  customMonths,
  projection,
  warning,
}: {
  customMonths: number;
  projection: Projection;
  warning?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    currentBalance: projection ? centsToMoneyInput(projection.currentBalanceCents) : "0,00",
    monthlyContribution: projection ? centsToMoneyInput(projection.monthlyContributionCents) : "0,00",
    expectedMonthlyRate: projection ? (projection.expectedMonthlyRateBps / 100).toFixed(2).replace(".", ",") : "1,00",
    referenceDate: projection?.referenceDate ?? new Date().toISOString().slice(0, 10),
  });

  async function onSubmit() {
    try {
      await saveInvestmentPortfolioAction({
        currentBalanceCents: moneyInputToCents(form.currentBalance),
        monthlyContributionCents: moneyInputToCents(form.monthlyContribution),
        expectedMonthlyRateBps: Math.round(Number(form.expectedMonthlyRate.replace(",", ".")) * 100),
        referenceDate: form.referenceDate,
      });
      toast.success("Carteira salva.");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  const cards = Object.entries(projection?.projection ?? {}).map(([months, value]) => ({
    months: Number(months),
    value,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Investimentos"
        title="Carteira consolidada e simulador"
        description="Se a leitura ainda falhar, a página abre vazia e permite salvar a carteira inicial do zero."
        actions={<InvestmentsActions customMonths={customMonths} />}
      />
      {warning ? (
        <InlineWarning message="A leitura da carteira falhou, mas a tela foi aberta zerada para permitir o cadastro inicial." />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={<PiggyBank className="size-5" />}
          label="Saldo atual"
          value={projection ? formatCurrency(projection.currentBalanceCents) : "R$ 0,00"}
          accent="cyan"
        />
        <InfoCard
          icon={<TrendingUp className="size-5" />}
          label="Aporte mensal"
          value={projection ? formatCurrency(projection.monthlyContributionCents) : "R$ 0,00"}
          accent="sky"
        />
        <InfoCard
          icon={<Calculator className="size-5" />}
          label="Taxa mensal esperada"
          value={projection ? formatRateFromBps(projection.expectedMonthlyRateBps) : "1,00% a.m."}
          accent="blue"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Atualizar carteira</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input value={form.currentBalance} onChange={(event) => setForm((state) => ({ ...state, currentBalance: event.target.value }))} placeholder="Saldo atual" />
            <Input value={form.monthlyContribution} onChange={(event) => setForm((state) => ({ ...state, monthlyContribution: event.target.value }))} placeholder="Aporte mensal" />
            <Input value={form.expectedMonthlyRate} onChange={(event) => setForm((state) => ({ ...state, expectedMonthlyRate: event.target.value }))} placeholder="Taxa mensal (%)" />
            <Input type="date" value={form.referenceDate} onChange={(event) => setForm((state) => ({ ...state, referenceDate: event.target.value }))} />
            <Button disabled={isPending} onClick={() => startTransition(() => void onSubmit())}>
              {isPending ? "Salvando..." : "Salvar carteira"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader>
              <CardTitle>Projeções</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {cards.length ? (
                cards.map((card) => (
                  <div key={card.months} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">
                      {card.months === customMonths ? `${card.months} meses (simulador)` : `${card.months} meses`}
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-cyan-300">
                      {formatCurrency(card.value)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  Salve a carteira acima para visualizar as projeções de 1, 6, 12 e {customMonths} meses.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-800 bg-[#06152d] text-white">
            <CardHeader>
              <CardTitle>Leitura amigável da fórmula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-200">
              <p>A simulação aplica juros compostos sobre o saldo atual e soma o aporte mensal ao final de cada competência.</p>
              <p>Na prática: saldo seguinte = saldo atual com rendimento + novo aporte.</p>
              <p>
                Referência atual:{" "}
                <span className="font-semibold text-white">
                  {projection ? formatDateLabel(projection.referenceDate) : "não definida"}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "cyan" | "sky" | "blue";
}) {
  const styles = {
    cyan: "text-cyan-300 bg-cyan-500/12",
    sky: "text-sky-300 bg-sky-500/12",
    blue: "text-blue-300 bg-blue-500/12",
  } as const;

  return (
    <Card className="rounded-[1.5rem] border-slate-800 bg-slate-950/75">
      <CardContent className="space-y-3 pt-6">
        <div className={cn("inline-flex rounded-full p-2", styles[accent])}>{icon}</div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="font-heading text-3xl font-semibold tracking-tight text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}
