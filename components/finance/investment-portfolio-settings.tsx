"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Save, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  configureInvestmentPortfolioAction,
  reconcileInvestmentBalanceAction,
  updateInvestmentSettingsAction,
} from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestmentField } from "@/components/finance/investment-field";
import type { InvestmentPortfolioSettingsProps } from "@/lib/interfaces/investments";
import {
  centsToMoneyInput,
  extractErrorMessage,
  formatCurrency,
  formatDateLabel,
  formatRateFromBps,
  moneyInputToCents,
} from "@/lib/finance-ui";

export function InvestmentPortfolioSettings({ projection }: InvestmentPortfolioSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rate, setRate] = useState(
    projection ? formatRateInput(projection.expectedMonthlyRateBps) : "1,00"
  );
  const [initialBalance, setInitialBalance] = useState("0,00");
  const [initialDate, setInitialDate] = useState(todayDate());
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [reconciledBalance, setReconciledBalance] = useState(
    projection ? centsToMoneyInput(projection.currentBalanceCents) : "0,00"
  );
  const [reconciledDate, setReconciledDate] = useState(
    projection?.asOfDate ?? todayDate()
  );

  async function onConfigure() {
    try {
      await configureInvestmentPortfolioAction({
        checkpointBalanceCents: moneyInputToCents(initialBalance),
        expectedMonthlyRateBps: parseRate(rate),
        checkpointDate: initialDate,
      });
      toast.success("Carteira configurada.");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function onUpdateRate() {
    try {
      await updateInvestmentSettingsAction({
        expectedMonthlyRateBps: parseRate(rate),
      });
      toast.success("Taxa esperada atualizada.");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function onReconcile() {
    try {
      await reconcileInvestmentBalanceAction({
        checkpointBalanceCents: moneyInputToCents(reconciledBalance),
        checkpointDate: reconciledDate,
      });
      toast.success("Saldo real conferido e novo checkpoint criado.");
      setIsReconcileOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  if (!projection) {
    return (
      <Card className="h-full rounded-[1.75rem] border-slate-800 bg-slate-950/75">
        <CardHeader>
          <CardTitle>Configurar carteira</CardTitle>
          <p className="text-sm leading-6 text-slate-400">
            Informe o primeiro saldo real. A partir dele, a carteira será atualizada pela taxa
            esperada e pelos lançamentos realizados.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <InvestmentField
            id="investment-initial-balance"
            label="Saldo real no checkpoint"
            value={initialBalance}
            placeholder="0,00"
            onChange={setInitialBalance}
          />
          <InvestmentField
            id="investment-initial-date"
            label="Data do checkpoint"
            type="date"
            value={initialDate}
            onChange={setInitialDate}
          />
          <InvestmentField
            id="investment-expected-rate"
            label="Taxa mensal esperada (%)"
            value={rate}
            placeholder="1,00"
            onChange={setRate}
          />
          <Button
            disabled={isPending || !initialDate || !initialBalance}
            onClick={() => startTransition(() => void onConfigure())}
          >
            <Save className="size-4" />
            {isPending ? "Salvando..." : "Configurar carteira"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full rounded-[1.75rem] border-slate-800 bg-slate-950/75">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Premissas e conferência</CardTitle>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                O saldo é estimado diariamente. Use a conferência quando o valor real da corretora
                divergir da taxa modelada.
              </p>
            </div>
            <div className="rounded-full bg-cyan-400/10 p-2 text-cyan-300">
              <SlidersHorizontal className="size-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Checkpoint</p>
              <p className="mt-1 font-semibold text-slate-100">
                {formatCurrency(projection.checkpointBalanceCents)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Data</p>
              <p className="mt-1 font-semibold text-slate-100">
                {formatDateLabel(projection.checkpointDate)}
              </p>
            </div>
          </div>
          <InvestmentField
            id="investment-expected-rate"
            label="Taxa mensal esperada (%)"
            value={rate}
            placeholder="1,00"
            onChange={setRate}
          />
          <p className="text-xs leading-5 text-slate-500">
            A taxa atual é {formatRateFromBps(projection.expectedMonthlyRateBps)} e serve para
            estimar o rendimento entre movimentações.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => startTransition(() => void onUpdateRate())}
            >
              <Save className="size-4" />
              {isPending ? "Salvando..." : "Salvar taxa"}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => {
                setReconciledBalance(centsToMoneyInput(projection.currentBalanceCents));
                setReconciledDate(projection.asOfDate);
                setIsReconcileOpen(true);
              }}
            >
              <RefreshCcw className="size-4" />
              Conferir saldo real
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Conferir saldo real</DialogTitle>
            <DialogDescription className="leading-6 text-slate-400">
              Use o valor exibido pela corretora. Esse valor passa a ser a nova base para os
              rendimentos futuros e incorpora os movimentos anteriores à data escolhida.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <InvestmentField
              id="investment-reconciled-balance"
              label="Saldo real"
              value={reconciledBalance}
              placeholder="0,00"
              onChange={setReconciledBalance}
            />
            <InvestmentField
              id="investment-reconciled-date"
              label="Data da conferência"
              type="date"
              value={reconciledDate}
              onChange={setReconciledDate}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReconcileOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={isPending || !reconciledBalance || !reconciledDate}
              onClick={() => startTransition(() => void onReconcile())}
            >
              {isPending ? "Conferindo..." : "Salvar checkpoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function parseRate(value: string) {
  const parsed = Number(value.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Informe uma taxa mensal válida.");
  }

  return Math.round(parsed * 100);
}

function formatRateInput(bps: number) {
  return (bps / 100).toFixed(2).replace(".", ",");
}

function todayDate() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
