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
import type { PurposeDialogProps } from "@/lib/interfaces/investment-portfolio";
import { PortfolioField } from "@/components/finance/investment-portfolio/portfolio-field";
import { investmentPurposeColorOptions } from "@/lib/finance-ui";

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
      <DialogContent className="border-border bg-surface text-content-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{state?.mode === "edit" ? "Editar caixinha" : "Nova caixinha"}</DialogTitle>
          <DialogDescription className="leading-6 text-content">
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
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
            <PortfolioField label="Nome" htmlFor="purpose-name">
              <Input
                id="purpose-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex.: Reserva de emergência"
                autoFocus
              />
            </PortfolioField>
            <PortfolioField label="Cor" htmlFor="purpose-color">
              <Select
                value={form.color}
                onValueChange={(value) => setForm((current) => ({ ...current, color: value }))}
              >
                <SelectTrigger
                  id="purpose-color"
                  className="w-full border-input bg-surface-raised/60"
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-border bg-surface text-content-strong">
                  {Object.entries(investmentPurposeColorOptions).map(([key, option]) => (
                    <SelectItem key={key} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: option.value }}
                          aria-hidden="true"
                        />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PortfolioField>
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
