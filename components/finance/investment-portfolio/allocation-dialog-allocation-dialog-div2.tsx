"use client";

import { PortfolioField } from "@/components/finance/investment-portfolio/portfolio-field";
import { MoneyInput } from "@/components/finance/money-input";
import { Input } from "@/components/ui/input";
import type { AllocationDialogDiv2Props } from "@/lib/interfaces/render/allocation-dialog-allocation-dialog-div2";

export function AllocationDialogDiv2({ form, setForm }: AllocationDialogDiv2Props) {
  return (
<div className="grid gap-4 sm:grid-cols-2">
            <PortfolioField label="Valor alocado (R$)" htmlFor="allocation-amount">
              <MoneyInput
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
  );
}
