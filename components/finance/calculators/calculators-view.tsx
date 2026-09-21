import { CalculatorCatalogCard } from "@/components/finance/calculators/calculator-catalog-card";
import { PageHeader } from "@/components/finance/page-header";

export function CalculatorsView() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planejamento"
        title="Calculadoras financeiras"
        description="Teste cenários antes de tomar uma decisão. As simulações ficam somente neste dispositivo e não alteram seus dados financeiros."
      />

      <section aria-label="Calculadoras disponíveis" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <CalculatorCatalogCard
          href="/calculators/compound-interest"
          title="Juros compostos"
          description="Projete o crescimento de um valor inicial com aportes recorrentes e compare o capital investido com os juros acumulados."
          badge="Disponível"
        />
      </section>
    </div>
  );
}
