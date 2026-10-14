import { calculateIncomeTax, INSS_CEILING_CENTS, validateCents, validateDependents } from "@/lib/income-tax";
import { presumedTaxes } from "@/lib/presumed-income";
import { simplesRate } from "@/lib/simples-national";
import type { IncomeResult, PjIncomeInput, TaxLine } from "@/lib/interfaces/income-calculators";

export function calculatePjIncome(input: PjIncomeInput): IncomeResult {
  const { revenueCents, regime, activity, annex, manualRate, dependents } = input;
  validateCents(revenueCents); validateDependents(dependents);
  if (!["mei", "simples", "presumido"].includes(regime)) throw new Error("Selecione um regime válido.");
  if (!["commerce", "services", "mixed", "other"].includes(activity)) throw new Error("Selecione uma atividade válida.");
  const annual = revenueCents * 12;
  const limit = regime === "mei" ? 8100000 : regime === "simples" ? 480000000 : 7800000000;
  if (annual > limit) throw new Error("A receita projetada excede o limite anual deste regime.");
  const proLabore = input.proLaboreCents ?? (regime === "mei" ? 0 : 162100);
  validateCents(proLabore);
  if (proLabore > revenueCents) throw new Error("O pró-labore não pode exceder a receita mensal.");
  if (manualRate !== undefined && (!Number.isFinite(manualRate) || manualRate < 0 || manualRate > 100)) throw new Error("Informe uma alíquota de DAS entre 0% e 100%.");
  const lines: TaxLine[] = [];
  const assumptions = ["Regras de outubro/2026. Receita constante × 12; único titular residente no Brasil, contabilidade regular e retirada de todo o lucro disponível. Sem custos operacionais.", "Pressupõe cumprimento das obrigações acessórias para dispensa de IBS/CBS no ano de teste de 2026. Sem benefícios fiscais ou regimes setoriais especiais.", "Pró-labore é transferência ao titular, não desconto duplicado da renda total. IRPF anual e tributação mínima anual não integram a simulação."];
  let partial = false;
  if (regime === "mei") {
    if (activity === "other") throw new Error("Selecione comércio, serviços ou atividade mista para MEI.");
    lines.push({ label: "DAS MEI (inclui INSS)", amountCents: activity === "commerce" ? 8205 : activity === "services" ? 8605 : 8705, baseCents: 162100, rate: 0.05 });
    assumptions.push("INSS do titular já incluído no DAS MEI; não descontado novamente. Limite: R$ 81 mil/ano.");
  } else if (regime === "simples") {
    const automatic = simplesRate(annual, annex);
    const rate = manualRate === undefined ? automatic.rate : manualRate / 100;
    lines.push({ label: "DAS Simples Nacional", baseCents: revenueCents, rate, amountCents: Math.round(revenueCents * rate) });
    assumptions.push(manualRate === undefined ? `Anexo ${annex}, faixa ${automatic.bracket}: (RBT12 × ${automatic.nominal}% − R$ ${automatic.deduction}) ÷ RBT12. Anexo informado pelo usuário; CNAE e fator R não determinados.` : "Alíquota manual substitui a alíquota efetiva automática. Confirme os tributos fora do DAS.");
    partial = annual > 360000000 || manualRate !== undefined;
    if (partial) assumptions.push("Resultado parcial: ICMS/ISS acima do sublimite ou recolhimentos fora do DAS não foram informados.");
  } else {
    lines.push(...presumedTaxes(revenueCents, activity === "services"));
    partial = activity !== "services";
    assumptions.push("Lucro Presumido: limite de R$ 78 milhões/ano; opção depende também da receita do ano anterior e da elegibilidade da atividade.", "IRPJ/CSLL provisionados por trimestre constante. Presunção acrescida em 10% sobre receita trimestral acima de R$ 1,25 milhão; regra de IRPJ desde janeiro e CSLL desde abril/2026.", "Serviços: presunção 32%, ISS de referência 3%. Outras atividades: IRPJ 8%, CSLL 12%; ICMS/IPI não incluídos.");
    if (partial) assumptions.push("Resultado parcial: faltam ICMS/IPI e tributos específicos da atividade.");
  }
  const inss = regime === "mei" ? 0 : Math.round(Math.min(proLabore, INSS_CEILING_CENTS) * 0.11);
  const ir = calculateIncomeTax(proLabore, inss, dependents);
  const employer = regime === "presumido" || (regime === "simples" && annex === 4) ? Math.round(proLabore * 0.2) : 0;
  lines.push({ label: "Contribuição patronal", baseCents: proLabore, rate: employer ? 0.2 : 0, amountCents: employer }, { label: "INSS do pró-labore", baseCents: Math.min(proLabore, INSS_CEILING_CENTS), rate: regime === "mei" ? 0 : 0.11, amountCents: inss }, { label: "IRRF do pró-labore", baseCents: ir.baseCents, rate: ir.rate, amountCents: ir.taxCents });
  assumptions.push(`Pró-labore: R$ ${(proLabore / 100).toFixed(2)}. IRRF usa dedução ${ir.simplified ? "simplificada" : "legal"}; redução mensal de 2026 aplicada.`);
  const companyTaxes = lines.filter(line => !["INSS do pró-labore", "IRRF do pró-labore"].includes(line.label)).reduce((sum, line) => sum + line.amountCents, 0);
  const dividends = Math.max(0, revenueCents - companyTaxes - proLabore);
  const withholding = dividends > 5000000 ? Math.round(dividends * 0.1) : 0;
  lines.push({ label: "IRRF sobre dividendos", baseCents: dividends, rate: withholding ? 0.1 : 0, amountCents: withholding });
  assumptions.push("Dividendos acima de R$ 50 mil/mês: retenção de 10% sobre o total distribuído, inclusive Simples Nacional. Sem lucros de anos anteriores.");
  const deductionsCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const netCents = revenueCents - deductionsCents;
  if (netCents < 0) assumptions.push("Os descontos excederam a receita; o resultado negativo foi preservado.");
  return { annualRevenueCents: annual, proLaboreCents: proLabore, dividendsCents: dividends, grossCents: revenueCents, proceedsCents: revenueCents, deductionsCents, netCents, netPercentage: revenueCents ? netCents / revenueCents * 100 : 0, lines, assumptions, partial };
}
