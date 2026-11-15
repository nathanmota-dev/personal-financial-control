import { CalculatorCatalogCard } from "@/components/finance/calculators/calculator-catalog-card";
import { PageHeader } from "@/components/finance/page-header";
import { CALCULATORS_CATALOG } from "@/lib/calculators-catalog";

export function CalculatorsView() {
  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        eyebrow="Planejamento"
        title="Calculadoras financeiras"
        description="Teste cenários antes de tomar uma decisão. As simulações ficam somente neste dispositivo e não alteram seus dados financeiros."
      />

      <section aria-label="Calculadoras disponíveis" className="grid gap-6 min-[100.0625rem]:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {CALCULATORS_CATALOG.map((calculator) => <CalculatorCatalogCard key={calculator.href} {...calculator} />)}
      </section>
    </div>
  );
}
