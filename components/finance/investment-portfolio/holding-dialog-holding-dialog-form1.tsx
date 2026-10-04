"use client";

import { HoldingDialogDiv1 } from "@/components/finance/investment-portfolio/holding-dialog-holding-dialog-div1";
import { PortfolioField } from "@/components/finance/investment-portfolio/portfolio-field";
import { MoneyInput } from "@/components/finance/money-input";
import { Button } from "@/components/ui/button";
import {
DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HoldingDialogForm1Props } from "@/lib/interfaces/render/holding-dialog-holding-dialog-form1";

export function HoldingDialogForm1({ onSubmit, form, setForm, assetClasses, instrumentTypes, onOpenChange, isPending, state }: HoldingDialogForm1Props) {
  return (
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

          <HoldingDialogDiv1 form={form} setForm={setForm} assetClasses={assetClasses} instrumentTypes={instrumentTypes} />

          <div className="grid gap-4 sm:grid-cols-2">
            <PortfolioField label="Valor atual (R$)" htmlFor="holding-current-value">
              <MoneyInput
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
  );
}
