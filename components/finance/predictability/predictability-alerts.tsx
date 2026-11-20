"use client";

import { Check } from "lucide-react";

import type { PredictabilityAlertsProps } from "@/app/interfaces/predictability";
import { AlertListItem } from "@/components/finance/ds/alert-list-item";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";

import { formatAlertDetail, formatAlertTitle } from "./labels";

export function PredictabilityAlerts({ alerts }: PredictabilityAlertsProps) {
  const { formatCurrencyText } = useFinancialFormatter();

  if (!alerts.length) {
    return (
      <p className="mt-3 flex items-center gap-2 text-[13px] text-content">
        <Check aria-hidden className="size-4 shrink-0 text-success" />
        Nenhum alerta neste ciclo.
      </p>
    );
  }

  return (
    <ul className="mt-1 divide-y divide-border">
      {alerts.map((alert) => (
        <AlertListItem
          key={alert.code}
          danger={alert.code !== "NO_RECURRING_INCOME"}
          title={formatAlertTitle(alert)}
          detail={formatAlertDetail(alert, formatCurrencyText(alert.amountCents ?? 0))}
        />
      ))}
    </ul>
  );
}
