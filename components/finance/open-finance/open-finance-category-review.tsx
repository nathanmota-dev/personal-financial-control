"use client";

import { OpenFinanceCategoryReviewRow } from "@/components/finance/open-finance/open-finance-category-review-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpenFinanceCategoryReview } from "@/hooks/use-open-finance-category-review";
import type { OpenFinanceCategoryReviewProps } from "@/lib/interfaces/components/open-finance";
import { pluggyCategoryGroupKey } from "@/lib/pluggy-ui";

export function OpenFinanceCategoryReview({ categories, refreshKey }: OpenFinanceCategoryReviewProps) {
  const { groups, applyingKey, error, apply } = useOpenFinanceCategoryReview(refreshKey);
  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle>Pendências de categoria</CardTitle>
        <CardDescription>Escolha uma vez e a categoria vale para os lançamentos pendentes com a mesma descrição e para as próximas sincronizações.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {groups && !groups.length ? <p className="text-sm text-content-muted">Nenhuma pendência de categoria.</p> : null}
        {groups?.length ? (
          <ul className="space-y-2">
            {groups.map((group) => {
              const key = pluggyCategoryGroupKey(group);
              return <OpenFinanceCategoryReviewRow key={key} group={group} categories={categories} applying={applyingKey === key} disabled={applyingKey !== null} onApply={apply} />;
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
