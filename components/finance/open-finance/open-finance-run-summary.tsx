"use client";

import { OpenFinanceRunAttention } from "@/components/finance/open-finance/open-finance-run-attention";
import { Badge } from "@/components/ui/badge";
import type { OpenFinanceRunSummaryProps } from "@/lib/interfaces/components/open-finance";
import { formatPluggyDateTime, pluggyBankCountLabels, pluggyCardCountLabels, pluggyRunStatusLabels } from "@/lib/pluggy-ui";

export function OpenFinanceRunSummary({ run }: OpenFinanceRunSummaryProps) {
  const { summary } = run;
  const imported = [...pluggyBankCountLabels, ...pluggyCardCountLabels].flatMap(([name, label]) => summary?.counts[name] ? [`${summary.counts[name]} ${label}`] : []);
  return (
    <div role="status" aria-label="Última sincronização" className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={run.status === "failed" ? "destructive" : "outline"}>{pluggyRunStatusLabels[run.status]}</Badge>
        <time className="text-content-muted" dateTime={run.startedAt}>Última execução: {formatPluggyDateTime(run.startedAt)}</time>
      </div>
      {summary ? (
        <p className="text-content-muted">
          {summary.items.total} conexões · {summary.accounts.total} contas · {summary.failures.length} falhas
        </p>
      ) : null}
      {imported.length ? <p className="text-content-muted">{imported.join(" · ")}</p> : null}
      {summary?.failures.length ? (
        <ul className="space-y-1">
          {summary.failures.map((failure) => (
            <li key={`${failure.step}-${failure.targetId}`}>
              <span data-user-content className="font-medium text-content-strong">{failure.label}</span>: {failure.message}
            </li>
          ))}
        </ul>
      ) : null}
      {summary?.attention?.length ? <OpenFinanceRunAttention items={summary.attention} /> : null}
    </div>
  );
}
