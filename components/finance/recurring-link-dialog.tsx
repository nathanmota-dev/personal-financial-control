"use client";

import { Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveRecurringLinksAction } from "@/app/actions/finance";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { RecurringGeneratedEntries } from "@/components/finance/recurring-generated-entries";
import { RecurringLinkCandidateRow } from "@/components/finance/recurring-link-candidate-row";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRecurringLinkCandidates } from "@/hooks/finance/use-recurring-link-candidates";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { RecurringLinkDialogProps } from "@/lib/interfaces/recurring";

function matchesQuery(query: string, ...values: (string | null)[]) {
  const needle = query.trim().toLocaleLowerCase("pt-BR");
  return !needle || values.some((value) => value?.toLocaleLowerCase("pt-BR").includes(needle));
}

export function RecurringLinkDialog({ template, month, open, onOpenChange }: RecurringLinkDialogProps) {
  const router = useRouter();
  const { formatCurrency } = useFinancialFormatter();
  const { result, error } = useRecurringLinkCandidates(template.id, month);
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState("");
  const [isSaving, startSaving] = useTransition();
  const candidates = result?.candidates ?? [];
  const selected = picked ?? new Set(candidates.filter((candidate) => candidate.isLinked).map((candidate) => candidate.id));
  const selectedCents = candidates.filter((candidate) => selected.has(candidate.id)).reduce((total, candidate) => total + candidate.amountCents, 0);
  const visible = candidates.filter((candidate) => matchesQuery(query, candidate.description, candidate.accountName, candidate.categoryName));
  const generated = result?.generated ?? [];

  function toggle(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setPicked(next);
  }

  function save() {
    const chosen = candidates.filter((candidate) => selected.has(candidate.id));
    startSaving(async () => {
      const response = await saveRecurringLinksAction({
        templateId: template.id,
        month,
        transactionIds: chosen.filter((candidate) => candidate.kind === "transaction").map((candidate) => candidate.id),
        chargeIds: chosen.filter((candidate) => candidate.kind === "card").map((candidate) => candidate.id),
      });
      if (!response.ok) {
        toast.error(response.error.message);
        return;
      }
      toast.success("Vínculos salvos.");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-content-strong sm:max-w-xl">
        <DialogHeader icon={<Link2 />}>
          <DialogTitle>{`Lançamentos de ${template.description}`}</DialogTitle>
          <DialogDescription className="leading-6 text-content">
            {`${formatMonthLabel(month)} · previsto ${formatCurrency(template.amountCents)}. ${generated.length ? "O app já lançou esta recorrência no mês." : "Marque o que pagou esta recorrência, no banco ou no cartão."}`}
          </DialogDescription>
        </DialogHeader>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {!result && !error ? <div className="flex justify-center py-8"><Spinner aria-label="Carregando lançamentos" /></div> : null}
        {generated.length ? <RecurringGeneratedEntries entries={generated} /> : null}
        {result && !generated.length ? (
          candidates.length ? (
            <>
              <Input aria-label="Filtrar lançamentos" placeholder="Filtrar por descrição, conta ou categoria" value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 rounded-[10px]" />
              <ul aria-label="Lançamentos do mês" className="max-h-[320px] divide-y divide-border overflow-y-auto">
                {visible.map((candidate) => (
                  <RecurringLinkCandidateRow key={candidate.id} candidate={candidate} checked={selected.has(candidate.id)} onCheckedChange={(checked) => toggle(candidate.id, checked)} />
                ))}
              </ul>
              <p className="text-xs text-content">{`Selecionado ${formatCurrency(selectedCents)} de ${formatCurrency(template.amountCents)} previsto`}</p>
            </>
          ) : (
            <FinanceEmptyState title="Nenhum lançamento compatível" description="Não há lançamentos do mesmo tipo perto deste mês que ainda não paguem outra recorrência." />
          )
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{generated.length ? "Fechar" : "Cancelar"}</Button>
          {result && !generated.length && candidates.length ? (
            <Button type="button" disabled={isSaving} onClick={save}>{isSaving ? "Salvando..." : "Salvar vínculos"}</Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
