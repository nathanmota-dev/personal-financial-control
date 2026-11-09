"use client";

import { Badge } from "@/components/ui/badge";
import type { OpenFinanceRunSummaryProps } from "@/lib/interfaces/components/open-finance";
import { formatPluggyDateTime, pluggyRunStatusLabels } from "@/lib/pluggy-ui";

export function OpenFinanceRunSummary({ run }: OpenFinanceRunSummaryProps) {
  const { summary } = run;
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
      {summary?.failures.length ? (
        <ul className="space-y-1">
          {summary.failures.map((failure) => (
            <li key={`${failure.step}-${failure.targetId}`}>
              <span data-user-content className="font-medium text-content-strong">{failure.label}</span>: {failure.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
