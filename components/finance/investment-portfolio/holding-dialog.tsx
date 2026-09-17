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
import type { HoldingDialogProps } from "@/lib/interfaces/investment-portfolio";
import { PortfolioField } from "@/components/finance/investment-portfolio/portfolio-field";

export function HoldingDialog({
  state,
  form,
  setForm,
  assetClasses,
  instrumentTypes,
  isPending,
  onOpenChange,
  onSubmit,
}: HoldingDialogProps) {
  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] overflow-y-auto border-border bg-surface text-content-strong sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{state?.mode === "edit" ? "Editar ativo" : "Cadastrar ativo"}</DialogTitle>
          <DialogDescription className="leading-6 text-content">
            Registre o valor atual informado pela instituição. Esse cadastro organiza o patrimônio
            e não cria lançamento financeiro.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
            <PortfolioField label="Nome do ativo" htmlFor="holding-name">
              <Input
                id="holding-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ex.: CDB liquidez diária"
                autoFocus
              />
            </PortfolioField>
            <PortfolioField label="Ticker (opcional)" htmlFor="holding-ticker">
              <Input
                id="holding-ticker"
                value={form.ticker}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ticker: event.target.value }))
                }
                placeholder="BOVA11"
              />
            </PortfolioField>
          </div>

          <PortfolioField label="Instituição (opcional)" htmlFor="holding-institution">
            <Input
              id="holding-institution"
              value={form.institutionName}
              onChange={(event) =>
                setForm((current) => ({ ...current, institutionName: event.target.value }))
              }
              placeholder="Ex.: XP Investimentos"
            />
          </PortfolioField>

          <div className="grid gap-4 sm:grid-cols-2">
            <PortfolioField label="Classe do ativo" htmlFor="holding-asset-class">
              <Select
                value={form.assetClass}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    assetClass: value as typeof current.assetClass,
                  }))
                }
              >
                <SelectTrigger id="holding-asset-class" className="w-full border-input bg-surface-raised/60">
                  <SelectValue placeholder="Selecione a classe" />
                </SelectTrigger>
                <SelectContent className="border-border bg-surface text-content-strong">
                  {assetClasses.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PortfolioField>
            <PortfolioField label="Tipo de instrumento" htmlFor="holding-instrument-type">
              <Select
                value={form.instrumentType}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    instrumentType: value as typeof current.instrumentType,
                  }))
                }
              >
                <SelectTrigger id="holding-instrument-type" className="w-full border-input bg-surface-raised/60">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="border-border bg-surface text-content-strong">
                  {instrumentTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PortfolioField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PortfolioField label="Valor atual (R$)" htmlFor="holding-current-value">
              <Input
                id="holding-current-value"
                value={form.currentValue}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentValue: event.target.value }))
                }
                placeholder="0,00"
                inputMode="decimal"
              />
            </PortfolioField>
            <PortfolioField label="Data do valor" htmlFor="holding-value-as-of">
              <Input
                id="holding-value-as-of"
                type="date"
                value={form.valueAsOf}
                onChange={(event) =>
                  setForm((current) => ({ ...current, valueAsOf: event.target.value }))
                }
              />
            </PortfolioField>
          </div>

          <PortfolioField label="Observações (opcional)" htmlFor="holding-notes">
            <Textarea
              id="holding-notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Contexto útil para futuras conferências."
              rows={3}
            />
          </PortfolioField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : state?.mode === "edit" ? "Salvar alterações" : "Cadastrar ativo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
