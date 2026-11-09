"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { OpenFinanceRunAttentionProps } from "@/lib/interfaces/components/open-finance";
import { pluggyAttentionLabels } from "@/lib/pluggy-ui";

export function OpenFinanceRunAttention({ items }: OpenFinanceRunAttentionProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <div className="space-y-1">
      <p className="font-medium text-content-strong">Itens que precisam de atenção</p>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={`${item.reason}-${item.date}-${index}`}>
            <span data-user-content className="font-medium text-content-strong">{item.description}</span>
            <span data-user-content className="text-content-muted"> · {item.accountLabel} · {item.date} · {formatCurrency(item.amountCents)}</span>
            <span className="block text-content-muted">{pluggyAttentionLabels[item.reason]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
