import { Calculator, RotateCcw } from "lucide-react";
import { CompoundInterestFormDiv1 } from "./compound-interest-form-compound-interest-form-div1";

import { CalculatorFormCard } from "@/components/finance/calculators/calculator-form-card";
import { FinancialPrivacyForm } from "@/components/finance/privacy/privacy-form";
import { Button } from "@/components/ui/button";
import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";
import type { CompoundInterestFormProps } from "@/lib/interfaces/compound-interest";

const buttonClassName = "h-10 gap-[10px] rounded-[10px] text-[13px] font-medium";

export function CompoundInterestForm({
  values,
  error,
  onChange,
  onSubmit,
  onClear,
}: CompoundInterestFormProps) {
  return (
    <CalculatorFormCard
      illustrationSrc={CALCULATOR_ILLUSTRATIONS.form}
      title="Dados da simulação"
      description="Informe os valores no formato brasileiro. O aporte é aplicado ao fim de cada mês."
    >
      <FinancialPrivacyForm>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <CompoundInterestFormDiv1 values={values} onChange={onChange} />

          {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Button type="submit" className={`${buttonClassName} min-w-36`}>
              <Calculator className="size-[17px]" />
              Calcular
            </Button>
            <Button type="button" variant="secondary" className={buttonClassName} onClick={onClear}>
              <RotateCcw className="size-[17px]" />
              Limpar
            </Button>
          </div>
        </form>
      </FinancialPrivacyForm>
    </CalculatorFormCard>
  );
}
