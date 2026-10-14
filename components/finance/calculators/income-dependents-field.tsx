import { Input } from "@/components/ui/input";
import type { IncomeFieldsProps } from "@/lib/interfaces/income-calculators";

export function IncomeDependentsField({ values, onChange }: IncomeFieldsProps) {
  return <label className="block space-y-2">Dependentes fiscais<Input aria-label="Dependentes fiscais" type="number" min="0" max="8" value={values.dependents} onChange={event => onChange({ ...values, dependents: event.target.value })} /></label>;
}
