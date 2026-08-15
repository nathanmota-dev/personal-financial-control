import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import type { ReconciliationAlertProps } from "@/lib/interfaces/investment-portfolio";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";

export function ReconciliationAlert({ dashboard }: ReconciliationAlertProps) {
  const { reconciliation, overAllocatedCents, globalBalanceCents, totalRegisteredCents } =
    dashboard;

  if (reconciliation.state === "aligned" && overAllocatedCents === 0) {
    return (
      <div className="flex items-start gap-3 rounded-[1.4rem] border border-teal-400/20 bg-teal-400/8 px-4 py-3 text-sm text-teal-100">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-300" />
        <p className="leading-6">
          Os ativos cadastrados fecham com o saldo global em{" "}
          {formatDateLabel(
            dashboard.investmentProjection?.asOfDate ??
              dashboard.lastValueAsOf ??
              "2026-01-01"
          )}
          .
        </p>
      </div>
    );
  }

  if (reconciliation.state === "not_configured") {
    return (
      <div className="flex items-start gap-3 rounded-[1.4rem] border border-sky-400/20 bg-sky-400/8 px-4 py-3 text-sm text-sky-100">
        <Info className="mt-0.5 size-4 shrink-0 text-sky-300" />
        <p className="leading-6">
          A carteira global ainda não tem checkpoint. Os percentuais usam os{" "}
          {formatCurrency(dashboard.totalRegisteredCents)} cadastrados como base até você
          configurar o saldo em{" "}
          <Link className="font-semibold text-cyan-200 underline underline-offset-4" href="/investments">
            Investimentos
          </Link>
          .
        </p>
      </div>
    );
  }

  const differenceCents = Math.abs(reconciliation.differenceCents ?? 0);
  const registrationMessage =
    reconciliation.state === "registered_above_global"
      ? "Os ativos cadastrados superam o saldo global em " + formatCurrency(differenceCents) + "."
      : "Faltam " +
        formatCurrency(differenceCents) +
        " em ativos cadastrados para fechar com o saldo global.";
  const allocationMessage =
    overAllocatedCents > 0
      ? "As caixinhas também estão " + formatCurrency(overAllocatedCents) + " acima do saldo global."
      : "Há " +
        formatCurrency(
          Math.max((globalBalanceCents ?? totalRegisteredCents) - dashboard.totalAllocatedCents, 0)
        ) +
        " ainda sem caixinha.";

  return (
    <div className="flex items-start gap-3 rounded-[1.4rem] border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
      <div className="space-y-1 leading-6">
        <p>{registrationMessage}</p>
        <p className="text-amber-100/75">{allocationMessage}</p>
      </div>
    </div>
  );
}
