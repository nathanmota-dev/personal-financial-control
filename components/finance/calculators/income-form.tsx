import { Calculator, RotateCcw } from "lucide-react";

import { CalculatorFormCard } from "@/components/finance/calculators/calculator-form-card";
import { FinancialPrivacyForm } from "@/components/finance/privacy/privacy-form";
import { Button } from "@/components/ui/button";
import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";
import { IncomeDependentsField } from "./income-dependents-field";
import { CurrencyInput } from "./currency-input";
import { IncomeCltFields } from "./income-clt-fields";
import { IncomePjFields } from "./income-pj-fields";
import type { IncomeFormProps } from "@/lib/interfaces/income-calculators";

const buttonClassName = "h-10 gap-[10px] rounded-[10px] text-[13px] font-medium";

export function IncomeForm({ pj, values, error, onChange, onSubmit, onClear }: IncomeFormProps) {
  const showDependents = !pj || values.regime !== "mei" || Number(values.proLabore.replace(/\D/g, "")) > 0;
  return <CalculatorFormCard illustrationSrc={CALCULATOR_ILLUSTRATIONS.form} title="Dados da simulação" description="Valores mensais em reais. Regras fiscais de 2026.">
    <FinancialPrivacyForm>
      <form className="space-y-6 text-[13px] text-content-strong" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
        <div className="grid gap-5 @md:grid-cols-2">
          <CurrencyInput id="gross" label={pj ? "Receita bruta mensal" : "Remuneração bruta"} value={values.gross} onValueChange={gross => onChange({ ...values, gross })} />
          {pj ? <IncomePjFields values={values} onChange={onChange} /> : <IncomeCltFields values={values} onChange={onChange} />}
          {pj && showDependents && <IncomeDependentsField values={values} onChange={onChange} />}
        </div>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <Button type="submit" className={`${buttonClassName} min-w-36`}><Calculator className="size-[17px]" />Calcular</Button>
          <Button type="button" variant="secondary" className={buttonClassName} onClick={onClear}><RotateCcw className="size-[17px]" />Limpar</Button>
        </div>
      </form>
    </FinancialPrivacyForm>
  </CalculatorFormCard>;
}
