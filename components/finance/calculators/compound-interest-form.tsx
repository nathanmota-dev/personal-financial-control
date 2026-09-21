import { Calculator, RotateCcw } from "lucide-react";

import { CurrencyInput } from "@/components/finance/calculators/currency-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CompoundInterestFormProps } from "@/lib/interfaces/compound-interest";

export function CompoundInterestForm({
  values,
  error,
  onChange,
  onSubmit,
  onClear,
}: CompoundInterestFormProps) {
  return (
    <Card className="border-brand/20 bg-surface/80 shadow-[0_24px_80px_rgb(var(--surface-rgb)/.35)]">
      <CardHeader>
        <CardTitle className="text-xl text-content-strong">Dados da simulação</CardTitle>
        <p className="text-sm leading-6 text-content">
          Informe os valores no formato brasileiro. O aporte é aplicado ao fim de cada mês.
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
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
                <div className="flex min-w-0 flex-1 rounded-xl border border-input bg-surface-raised/45 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                  <span className="flex items-center border-r border-input px-3 text-xs font-semibold text-content">%</span>
                  <Input
                    id="interest-rate"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={values.interestRate}
                    onChange={(event) => onChange({ ...values, interestRate: event.target.value })}
                    className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                </div>
                <Select
                  value={values.interestRatePeriod}
                  onValueChange={(value: "monthly" | "annual") =>
                    onChange({ ...values, interestRatePeriod: value })
                  }
                >
                  <SelectTrigger className="h-11 w-28 rounded-xl bg-surface-raised/45">
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
                  className="h-11 min-w-0 flex-1 rounded-xl bg-surface-raised/45"
                />
                <Select
                  value={values.investmentPeriodUnit}
                  onValueChange={(value: "months" | "years") =>
                    onChange({ ...values, investmentPeriodUnit: value })
                  }
                >
                  <SelectTrigger className="h-11 w-28 rounded-xl bg-surface-raised/45">
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

          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" className="min-w-36 rounded-xl">
              <Calculator className="size-4" />
              Calcular
            </Button>
            <Button type="button" size="lg" variant="ghost" className="rounded-xl text-content" onClick={onClear}>
              <RotateCcw className="size-4" />
              Limpar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
