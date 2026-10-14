import { CurrencyInput } from "./currency-input";
import { FormSelect } from "@/components/finance/form-select";
import { SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { IncomeFieldsProps, PjActivity, PjRegime } from "@/lib/interfaces/income-calculators";

export function IncomePjFields({ values, onChange }: IncomeFieldsProps) {
  return <>
    <label className="block space-y-2">Regime tributário<FormSelect aria-label="Regime tributário" value={values.regime} onValueChange={regime => onChange({ ...values, regime: regime as PjRegime, activity: "services", proLabore: "" })}>
      <SelectItem value="mei">MEI</SelectItem><SelectItem value="simples">Simples Nacional</SelectItem><SelectItem value="presumido">Lucro Presumido</SelectItem>
    </FormSelect></label>
    {values.regime === "simples" ? <label className="block space-y-2">Ramo de atividade<FormSelect aria-label="Ramo de atividade" value={values.annex} onValueChange={annex => onChange({ ...values, annex })}>
      <SelectItem value="1">Anexo I — Comércio</SelectItem><SelectItem value="2">Anexo II — Indústria</SelectItem><SelectItem value="3">Anexo III — Serviços gerais</SelectItem><SelectItem value="4">Anexo IV — Serviços específicos</SelectItem><SelectItem value="5">Anexo V — Serviços intelectuais</SelectItem>
    </FormSelect></label> : <label className="block space-y-2">Atividade<FormSelect aria-label="Atividade" value={values.activity} onValueChange={activity => onChange({ ...values, activity: activity as PjActivity })}>
      <SelectItem value="services">Serviços</SelectItem>{values.regime === "mei" ? <><SelectItem value="commerce">Comércio / Indústria</SelectItem><SelectItem value="mixed">Comércio e serviços</SelectItem></> : <SelectItem value="other">Outras atividades</SelectItem>}
    </FormSelect></label>}
    <div className="space-y-2"><CurrencyInput id="proLabore" label="Pró-labore" value={values.proLabore} onValueChange={proLabore => onChange({ ...values, proLabore })} /><p className="text-xs text-content-muted">Quando vazio: {values.regime === "mei" ? "R$ 0,00" : "R$ 1.621,00"}.</p></div>
    {values.regime === "simples" && <div className="space-y-3"><label className="flex items-center gap-2"><input type="checkbox" checked={values.manualEnabled} onChange={event => onChange({ ...values, manualEnabled: event.target.checked })} />Informar DAS manualmente</label>
      {values.manualEnabled && <label className="block space-y-2">Alíquota do DAS (%)<Input aria-label="Alíquota do DAS (%)" type="number" min="0" max="100" step="0.01" value={values.manualRate} onChange={event => onChange({ ...values, manualRate: event.target.value })} /></label>}
    </div>}
  </>;
}
