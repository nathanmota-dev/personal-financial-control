"use client";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/finance/page-header";
import { CalculatorEmptyResult } from "@/components/finance/calculators/calculator-empty-result";
import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";
import { EMPTY_INCOME_VALUES, normalizeIncomeValues, simulateIncome } from "@/lib/income-simulation";
import { IncomeForm } from "./income-form";
import { IncomeResults } from "./income-results";
import { IncomeSummary } from "./income-summary";
import { PjRegimeGuide } from "./pj-regime-guide";
import type { IncomeCalculatorProps, IncomeFormValues, IncomeResult } from "@/lib/interfaces/income-calculators";

export function IncomeCalculator({ pj = false }: IncomeCalculatorProps) {
  const storageKey = `personal-financial-control:${pj ? "pj-income" : "net-salary"}:2026`;
  const [values, setValues] = useState<IncomeFormValues>(EMPTY_INCOME_VALUES);
  const [result, setResult] = useState<IncomeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (!saved) return;
        const restored = normalizeIncomeValues(JSON.parse(saved));
        const next = simulateIncome(restored, pj);
        setValues(restored); setResult(next);
      } catch { try { window.localStorage.removeItem(storageKey); } catch { /* Storage unavailable. */ } }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pj, storageKey]);
  function submit() {
    try {
      const next = normalizeIncomeValues(values);
      const simulation = simulateIncome(next, pj);
      setValues(next); setResult(simulation); setError(null);
      try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Simulation works without storage. */ }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível calcular."); }
  }
  function clear() {
    setValues(EMPTY_INCOME_VALUES); setResult(null); setError(null);
    try { window.localStorage.removeItem(storageKey); } catch { /* Storage unavailable. */ }
  }
  return <div className="space-y-6 min-[100.0625rem]:space-y-5"><PageHeader className="[&>div:last-child]:-order-1" eyebrow="Calculadoras · Regras de 2026" title={pj ? "Renda PJ" : "Salário líquido CLT"} description={pj ? "Estime sua renda mensal após tributos, pró-labore e distribuição de lucros." : "Simule INSS, IRRF, benefícios e descontos da sua remuneração mensal."} actions={<BackButton href="/calculators" label="Voltar para calculadoras" />} />
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <IncomeForm pj={pj} values={values} error={error} onChange={setValues} onSubmit={submit} onClear={clear} />
      {result ? <IncomeSummary result={result} pj={pj} /> : <CalculatorEmptyResult illustrationSrc={pj ? CALCULATOR_ILLUSTRATIONS.pjIncome : CALCULATOR_ILLUSTRATIONS.netSalary} description={pj ? "Informe a receita bruta e o regime tributário e toque em Calcular." : "Informe a remuneração bruta e toque em Calcular."} />}
    </div>
    {result && <IncomeResults result={result} />}{pj && <PjRegimeGuide />}
    <p className="text-[11px] leading-5 text-content-muted">Simulação local, sem alterar seus registros. Fontes: <a className="underline" href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026">Receita Federal — IRRF 2026</a>, <a className="underline" href="https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal">INSS</a>, <a className="underline" href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm">LC 123</a> e <a className="underline" href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm">Lei 15.270/2025</a>. {pj ? <><a className="underline" href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes/pagamento-da-contribuicao-mensal-carne-mensal/qual-o-valor-das-contribuicoes">DAS MEI 2026</a> · <a className="underline" href="https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/beneficios-fiscais/perguntas-e-respostas-reducao-dos-incentivos-e-beneficios-tributarios-v5-final.pdf">Presunções de lucro em 2026</a></> : <a className="underline" href="https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia">Salário-família 2026</a>}</p>
  </div>;
}
