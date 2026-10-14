import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeDependentsField } from "./income-dependents-field";
import { CurrencyInput } from "./currency-input";
import { IncomeCltFields } from "./income-clt-fields";
import { IncomePjFields } from "./income-pj-fields";
import type { IncomeFormProps } from "@/lib/interfaces/income-calculators";

export function IncomeForm({ pj, values, error, onChange, onSubmit, onClear }: IncomeFormProps) {
  const showDependents = !pj || values.regime !== "mei" || Number(values.proLabore.replace(/\D/g, "")) > 0;
  return <Card className="border-border bg-card shadow-none"><CardHeader><CardTitle>Dados da simulação</CardTitle><p className="text-xs text-content-muted">Valores mensais em reais. Regras fiscais de 2026.</p></CardHeader><CardContent>
    <form className="space-y-6 text-content-strong" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
      <div className="grid gap-5 sm:grid-cols-2">
        <CurrencyInput id="gross" label={pj ? "Receita bruta mensal" : "Remuneração bruta"} value={values.gross} onValueChange={gross => onChange({ ...values, gross })} />
        {pj ? <IncomePjFields values={values} onChange={onChange} /> : <IncomeCltFields values={values} onChange={onChange} />}
        {pj && showDependents && <IncomeDependentsField values={values} onChange={onChange} />}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3"><Button type="submit" size="lg">Calcular</Button><Button type="button" variant="ghost" size="lg" onClick={onClear}>Limpar</Button></div>
    </form>
  </CardContent></Card>;
}
