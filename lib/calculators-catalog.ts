import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";
import type { CalculatorCatalogCardProps } from "@/lib/interfaces/compound-interest";

export const CALCULATORS_CATALOG: CalculatorCatalogCardProps[] = [
  {
    href: "/calculators/compound-interest",
    title: "Juros compostos",
    description: "Projete o crescimento de um valor inicial com aportes recorrentes e compare o capital investido com os juros acumulados.",
    badge: "Disponível",
    illustrationSrc: CALCULATOR_ILLUSTRATIONS.compoundInterest,
    highlights: ["Patrimônio final projetado", "Total investido e juros", "Evolução mês a mês"],
  },
  {
    href: "/calculators/net-salary",
    title: "Salário líquido CLT",
    description: "Simule INSS, IRRF, benefícios e descontos com as regras de 2026.",
    badge: "Disponível",
    illustrationSrc: CALCULATOR_ILLUSTRATIONS.netSalary,
    highlights: ["Líquido mensal estimado", "INSS, IRRF e FGTS", "Memória do cálculo"],
  },
  {
    href: "/calculators/pj-income",
    title: "Renda PJ",
    description: "Estime tributos e renda mensal no MEI, Simples Nacional ou Lucro Presumido.",
    badge: "Disponível",
    illustrationSrc: CALCULATOR_ILLUSTRATIONS.pjIncome,
    highlights: ["Renda mensal após tributos", "DAS, pró-labore e lucros", "Comparativo de regimes"],
  },
];
