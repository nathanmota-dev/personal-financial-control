import { Calculator,RotateCcw } from "lucide-react";
import { CompoundInterestFormDiv1 } from "./compound-interest-form-compound-interest-form-div1";

import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import type { CompoundInterestFormProps } from "@/lib/interfaces/compound-interest";

export function CompoundInterestForm({
  values,
  error,
  onChange,
  onSubmit,
  onClear,
}: CompoundInterestFormProps) {
  return (
    <Card className="border-border bg-card shadow-none">
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
          <CompoundInterestFormDiv1 values={values} onChange={onChange} />

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
