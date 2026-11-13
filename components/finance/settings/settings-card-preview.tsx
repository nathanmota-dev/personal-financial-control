"use client";

import { CreditCardVisual } from "@/components/finance/credit-card-visual";
import type { SettingsCardPreviewProps } from "@/lib/interfaces/settings";
import { formatCardDay } from "@/lib/settings-cards";

export function SettingsCardPreview({ card, closingDay, dueDay }: SettingsCardPreviewProps) {
  return (
    <CreditCardVisual
      card={card}
      statusLabel={null}
      details={[
        { label: "Fecha", value: formatCardDay(closingDay) },
        { label: "Vence", value: formatCardDay(dueDay) },
      ]}
    />
  );
}
