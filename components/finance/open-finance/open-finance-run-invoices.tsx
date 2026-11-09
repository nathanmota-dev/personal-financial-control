"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Badge } from "@/components/ui/badge";
import type { OpenFinanceRunInvoicesProps } from "@/lib/interfaces/components/open-finance";
import { pluggyInvoiceStatusLabels } from "@/lib/pluggy-ui";

export function OpenFinanceRunInvoices({ invoices }: OpenFinanceRunInvoicesProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <div className="space-y-1">
      <p className="font-medium text-content-strong">Conferência das faturas</p>
      <ul className="space-y-1">
        {invoices.map((invoice) => (
          <li key={`${invoice.accountLabel}-${invoice.invoiceMonth}`} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span data-user-content className="font-medium text-content-strong">{invoice.accountLabel} · {invoice.invoiceMonth}</span>
            <Badge variant={invoice.status === "matched" ? "outline" : "destructive"}>{pluggyInvoiceStatusLabels[invoice.status]}</Badge>
            <span data-user-content className="text-content-muted">Fatura {formatCurrency(invoice.statementTotalCents)}</span>
            {invoice.differenceCents ? <span data-user-content className="text-content-muted">Diferença {formatCurrency(invoice.differenceCents)}</span> : null}
            {invoice.unlinkedPaymentCents ? <span data-user-content className="text-content-muted">Pagamento não vinculado {formatCurrency(invoice.unlinkedPaymentCents)}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
