"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { OpenFinanceCategoryReviewRowProps } from "@/lib/interfaces/components/open-finance";
import { pluggyDirectionLabels, pluggyRuleCategoryOptions } from "@/lib/pluggy-ui";

export function OpenFinanceCategoryReviewRow({ group, categories, applying, disabled, onApply }: OpenFinanceCategoryReviewRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const fieldId = `open-finance-category-${group.direction}-${group.normalizedDescription}`;
  return (
    <li className="grid items-end gap-3 rounded-lg border border-border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <p data-user-content className="truncate text-sm font-medium text-content-strong">{group.normalizedDescription}</p>
        <p className="text-xs text-content-muted">
          {pluggyDirectionLabels[group.direction]} · {group.occurrences} {group.occurrences === 1 ? "lançamento" : "lançamentos"} · <span data-user-content>{formatCurrency(group.totalCents)}</span>
        </p>
      </div>
      <div className="min-w-0 space-y-1.5">
        <Label htmlFor={fieldId}>Categoria de {group.normalizedDescription}</Label>
        <NativeSelect id={fieldId} className="w-full" value="" disabled={disabled} onChange={(event) => { if (event.target.value) onApply(group, event.target.value); }}>
          <NativeSelectOption value="">Selecione uma categoria</NativeSelectOption>
          {pluggyRuleCategoryOptions(categories, group.direction).map((category) => <NativeSelectOption data-user-content key={category.id} value={category.id}>{category.name}</NativeSelectOption>)}
        </NativeSelect>
        {applying ? <p role="status" className="text-xs text-content-muted">Aplicando categoria…</p> : null}
      </div>
    </li>
  );
}
