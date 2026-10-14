import { IncomeDependentsField } from "./income-dependents-field";
import { CurrencyInput } from "./currency-input";
import { Input } from "@/components/ui/input";
import type { IncomeFieldsProps } from "@/lib/interfaces/income-calculators";

export function IncomeCltFields({ values, onChange }: IncomeFieldsProps) {
  return <>
    <IncomeDependentsField values={values} onChange={onChange} />
    <CurrencyInput id="benefits" label="Benefícios não tributáveis" value={values.benefits} onValueChange={benefits => onChange({ ...values, benefits })} />
    <CurrencyInput id="discounts" label="Descontos adicionais" value={values.discounts} onValueChange={discounts => onChange({ ...values, discounts })} />
    <div className="space-y-3"><label className="flex items-center gap-2"><input type="checkbox" checked={values.overtimeEnabled} onChange={event => onChange({ ...values, overtimeEnabled: event.target.checked })} />Incluir horas extras</label>
      {values.overtimeEnabled && <label className="block space-y-2">Quantidade de horas extras<Input aria-label="Quantidade de horas extras" type="number" min="0" max="744" step="0.01" value={values.overtime} onChange={event => onChange({ ...values, overtime: event.target.value })} /></label>}
    </div>
    <div className="space-y-3"><label className="flex items-center gap-2"><input type="checkbox" checked={values.familyEnabled} onChange={event => onChange({ ...values, familyEnabled: event.target.checked })} />Incluir salário-família</label>
      {values.familyEnabled && <label className="block space-y-2">Dependentes elegíveis ao salário-família<Input aria-label="Dependentes elegíveis ao salário-família" type="number" min="0" max="8" value={values.familyDependents} onChange={event => onChange({ ...values, familyDependents: event.target.value })} /></label>}
    </div>
  </>;
}
