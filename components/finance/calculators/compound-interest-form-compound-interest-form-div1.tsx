import { CurrencyInput } from "@/components/finance/calculators/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import type { CompoundInterestFormDiv1Props } from "@/lib/interfaces/render/compound-interest-form-compound-interest-form-div1";

export function CompoundInterestFormDiv1({ values, onChange }: CompoundInterestFormDiv1Props) {
  return (
<div className="grid gap-5 md:grid-cols-2">
            <CurrencyInput
              id="initial-amount"
              label="Valor inicial"
              value={values.initialAmount}
              onValueChange={(initialAmount) => onChange({ ...values, initialAmount })}
            />

            <CurrencyInput
              id="monthly-contribution"
              label="Valor mensal"
              value={values.monthlyContribution}
              onValueChange={(monthlyContribution) =>
                onChange({ ...values, monthlyContribution })
              }
            />

            <div className="space-y-2">
              <Label htmlFor="interest-rate">Taxa de juros</Label>
              <div className="flex gap-2">
                <div className="flex min-w-0 flex-1 rounded-xl border border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                  <span className="flex items-center border-r border-input px-3 text-xs font-semibold text-content">%</span>
                  <Input
                    id="interest-rate"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={values.interestRate}
                    onChange={(event) => onChange({ ...values, interestRate: event.target.value })}
                    className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                </div>
                <Select
                  value={values.interestRatePeriod}
                  onValueChange={(value: "monthly" | "annual") =>
                    onChange({ ...values, interestRatePeriod: value })
                  }
                >
                  <SelectTrigger className="h-10 w-28 rounded-xl bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">mensal</SelectItem>
                    <SelectItem value="annual">anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investment-period">Período</Label>
              <div className="flex gap-2">
                <Input
                  id="investment-period"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={values.investmentPeriodUnit === "years" ? "50" : "600"}
                  step="1"
                  placeholder="0"
                  value={values.investmentPeriod}
                  onChange={(event) => onChange({ ...values, investmentPeriod: event.target.value })}
                  className="h-10 min-w-0 flex-1 rounded-xl bg-card"
                />
                <Select
                  value={values.investmentPeriodUnit}
                  onValueChange={(value: "months" | "years") =>
                    onChange({ ...values, investmentPeriodUnit: value })
                  }
                >
                  <SelectTrigger className="h-10 w-28 rounded-xl bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">meses</SelectItem>
                    <SelectItem value="years">anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
  );
}
