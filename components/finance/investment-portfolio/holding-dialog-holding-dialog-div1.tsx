"use client";

import { PortfolioField } from "@/components/finance/investment-portfolio/portfolio-field";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import type { HoldingDialogDiv1Props } from "@/lib/interfaces/render/holding-dialog-holding-dialog-div1";

export function HoldingDialogDiv1({ form, setForm, assetClasses, instrumentTypes }: HoldingDialogDiv1Props) {
  return (
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
                <SelectTrigger id="holding-asset-class" className="w-full border-input bg-card">
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
                <SelectTrigger id="holding-instrument-type" className="w-full border-input bg-card">
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
  );
}
