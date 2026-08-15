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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { PurposeDialogProps } from "@/lib/interfaces/investment-portfolio";
import { PortfolioField } from "@/components/finance/investment-portfolio/portfolio-field";

export function PurposeDialog({
  state,
  form,
  setForm,
  isPending,
  onOpenChange,
  onSubmit,
}: PurposeDialogProps) {
  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{state?.mode === "edit" ? "Editar caixinha" : "Nova caixinha"}</DialogTitle>
          <DialogDescription className="leading-6 text-slate-400">
            Caixinhas representam finalidades patrimoniais. Para prazos e aportes futuros, use
            Metas.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_96px]">
            <PortfolioField label="Nome" htmlFor="purpose-name">
              <Input
                id="purpose-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex.: Reserva de emergência"
                autoFocus
              />
            </PortfolioField>
            <div className="grid gap-2">
              <Label htmlFor="purpose-color" className="text-slate-300">
                Cor
              </Label>
              <Input
                id="purpose-color"
                type="color"
                value={form.color}
                onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                className="h-9 cursor-pointer p-1"
              />
            </div>
          </div>

          <PortfolioField label="Alvo opcional (R$)" htmlFor="purpose-target">
            <Input
              id="purpose-target"
              value={form.targetAmount}
              onChange={(event) =>
                setForm((current) => ({ ...current, targetAmount: event.target.value }))
              }
              placeholder="Deixe em branco se não houver alvo"
              inputMode="decimal"
            />
          </PortfolioField>

          <PortfolioField label="Observações (opcional)" htmlFor="purpose-notes">
            <Textarea
              id="purpose-notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Como esta finalidade orienta sua organização patrimonial?"
              rows={3}
            />
          </PortfolioField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : state?.mode === "edit" ? "Salvar alterações" : "Criar caixinha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
