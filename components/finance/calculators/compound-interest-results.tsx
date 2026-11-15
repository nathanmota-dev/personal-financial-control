"use client";

import { CompoundInterestChart } from "@/components/finance/calculators/compound-interest-chart";
import { CompoundInterestTable } from "@/components/finance/calculators/compound-interest-table";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";
import type { CompoundInterestResultsProps } from "@/lib/interfaces/compound-interest";

export function CompoundInterestResults({ simulation }: CompoundInterestResultsProps) {
  return (
    <section aria-labelledby="simulation-result" className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <DashboardCardIllustration src={CALCULATOR_ILLUSTRATIONS.evolution} />
      <h2 id="simulation-result" className="text-lg font-semibold leading-[25px] text-content-strong">Evolução do patrimônio</h2>
      <p className="mt-1 pr-20 text-xs text-content-muted">Compare o crescimento acumulado com o valor que saiu do seu bolso.</p>
      <Tabs defaultValue="chart" className="mt-5 gap-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-72">
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="mt-0">
          <CompoundInterestChart points={simulation.points} />
        </TabsContent>
        <TabsContent value="table" className="mt-0">
          <CompoundInterestTable points={simulation.points} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
