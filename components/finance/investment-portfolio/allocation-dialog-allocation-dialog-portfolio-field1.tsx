"use client";

import { PortfolioField } from "@/components/finance/investment-portfolio/portfolio-field";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import type { AllocationDialogPortfolioField1Props } from "@/lib/interfaces/render/allocation-dialog-allocation-dialog-portfolio-field1";

export function AllocationDialogPortfolioField1({ form, setForm, isExisting, purposes }: AllocationDialogPortfolioField1Props) {
  return (
<PortfolioField label="Caixinha" htmlFor="allocation-purpose">
            <Select
              value={form.purposeId}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, purposeId: value }))
              }
              disabled={isExisting}
            >
              <SelectTrigger id="allocation-purpose" className="w-full border-input bg-card">
                <SelectValue placeholder="Selecione uma finalidade" />
              </SelectTrigger>
              <SelectContent className="border-border bg-surface text-content-strong">
                {purposes.map((purpose) => (
                  <SelectItem data-user-content key={purpose.id} value={purpose.id}>
                    {purpose.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PortfolioField>
  );
}
