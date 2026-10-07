"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { AllocationDialogDialogFooter3 } from "./allocation-dialog-allocation-dialog-dialog-footer3";
import { AllocationDialogDiv2 } from "./allocation-dialog-allocation-dialog-div2";
import { AllocationDialogPortfolioField1 } from "./allocation-dialog-allocation-dialog-portfolio-field1";

import { PortfolioField } from "@/components/finance/investment-portfolio/portfolio-field";
import {
Dialog,

DialogDescription,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { AllocationDialogProps } from "@/lib/interfaces/investment-portfolio";

export function AllocationDialog({
  state,
  form,
  setForm,
  holdings,
  purposes,
  availableCents,
  isExisting,
  isPending,
  onHoldingChange,
  onOpenChange,
  onSubmit,
  onDelete,
}: AllocationDialogProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(720px,calc(100vh-2rem))] overflow-y-auto border-border bg-card text-content-strong sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isExisting ? "Editar alocação" : "Alocar ativo"}</DialogTitle>
          <DialogDescription className="leading-6 text-content">
            Divida uma posição entre finalidades sem alterar o valor do ativo, os aportes ou as
            transações da conta.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <PortfolioField label="Ativo" htmlFor="allocation-holding">
            <Select
              value={form.holdingId}
              onValueChange={onHoldingChange}
              disabled={isExisting}
            >
              <SelectTrigger id="allocation-holding" className="w-full border-input bg-card">
                <SelectValue placeholder="Selecione um ativo" />
              </SelectTrigger>
              <SelectContent className="border-border bg-surface text-content-strong">
                {holdings.map((holding) => (
                  <SelectItem key={holding.id} value={holding.id}>
                    {holding.name} · {formatCurrency(holding.currentValueCents)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PortfolioField>

          <AllocationDialogPortfolioField1 form={form} setForm={setForm} isExisting={isExisting} purposes={purposes} />

          <AllocationDialogDiv2 form={form} setForm={setForm} />

          <div className="rounded-2xl border border-brand/15 bg-brand/[0.06] px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-content">Valor ainda livre neste ativo</span>
              <strong className="text-lg text-brand">
                {formatCurrency(Math.max(availableCents, 0))}
              </strong>
            </div>
            <p className="mt-1 text-xs leading-5 text-content">
              O valor disponível considera as outras caixinhas deste ativo.
            </p>
          </div>

          <PortfolioField label="Observações (opcional)" htmlFor="allocation-notes">
            <Textarea
              id="allocation-notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Ex.: parte do ETF destinada ao carro."
              rows={3}
            />
          </PortfolioField>

          <AllocationDialogDialogFooter3 isExisting={isExisting} isPending={isPending} onDelete={onDelete} onOpenChange={onOpenChange} holdings={holdings} purposes={purposes} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
