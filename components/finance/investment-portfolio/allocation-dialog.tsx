"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { AllocationDialogProps } from "@/lib/interfaces/investment-portfolio";
import { formatCurrency } from "@/lib/finance-ui";
import { PortfolioField } from "@/components/finance/investment-portfolio/portfolio-field";

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
  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(720px,calc(100vh-2rem))] overflow-y-auto border-border bg-surface text-content-strong sm:max-w-xl">
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
              <SelectTrigger id="allocation-holding" className="w-full border-input bg-surface-raised/60">
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

          <PortfolioField label="Caixinha" htmlFor="allocation-purpose">
            <Select
              value={form.purposeId}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, purposeId: value }))
              }
              disabled={isExisting}
            >
              <SelectTrigger id="allocation-purpose" className="w-full border-input bg-surface-raised/60">
                <SelectValue placeholder="Selecione uma finalidade" />
              </SelectTrigger>
              <SelectContent className="border-border bg-surface text-content-strong">
                {purposes.map((purpose) => (
                  <SelectItem key={purpose.id} value={purpose.id}>
                    {purpose.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PortfolioField>

          <div className="grid gap-4 sm:grid-cols-2">
            <PortfolioField label="Valor alocado (R$)" htmlFor="allocation-amount">
              <Input
                id="allocation-amount"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
                placeholder="0,00"
                inputMode="decimal"
                required
              />
            </PortfolioField>
            <PortfolioField label="Data da alocação" htmlFor="allocation-date">
              <Input
                id="allocation-date"
                type="date"
                value={form.allocatedOn}
                onChange={(event) =>
                  setForm((current) => ({ ...current, allocatedOn: event.target.value }))
                }
              />
            </PortfolioField>
          </div>

          <div className="rounded-2xl border border-brand/15 bg-brand/[0.06] px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-content">Valor ainda livre neste ativo</span>
              <strong className="font-heading text-lg text-brand">
                {formatCurrency(Math.max(availableCents, 0))}
              </strong>
            </div>
            <p className="mt-1 text-xs leading-5 text-content-strong0">
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

          <DialogFooter className="sm:justify-between">
            <div>
              {isExisting ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  onClick={onDelete}
                >
                  Remover alocação
                </Button>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !holdings.length || !purposes.length}>
                {isPending ? "Salvando..." : "Salvar alocação"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
