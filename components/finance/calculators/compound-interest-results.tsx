import { ChartLine, Coins, PiggyBank } from "lucide-react";

import { CompoundInterestChart } from "@/components/finance/calculators/compound-interest-chart";
import { CompoundInterestResultMetric } from "@/components/finance/calculators/compound-interest-result-metric";
import { CompoundInterestTable } from "@/components/finance/calculators/compound-interest-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CompoundInterestResultsProps } from "@/lib/interfaces/compound-interest";
import { formatCurrency } from "@/lib/finance-ui";

export function CompoundInterestResults({ simulation }: CompoundInterestResultsProps) {
  return (
    <section aria-labelledby="simulation-result" className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="grid gap-4 md:grid-cols-3">
        <CompoundInterestResultMetric
          title="Valor total final"
          value={formatCurrency(simulation.totalBalanceCents)}
          detail="Patrimônio projetado"
          icon={<ChartLine className="size-5" />}
          featured
        />
        <CompoundInterestResultMetric
          title="Valor total investido"
          value={formatCurrency(simulation.totalInvestedCents)}
          detail="Valor inicial + aportes"
          icon={<PiggyBank className="size-5" />}
        />
        <CompoundInterestResultMetric
          title="Total em juros"
          value={formatCurrency(simulation.totalInterestCents)}
          detail={`${(simulation.monthlyRate * 100).toFixed(3).replace(".", ",")}% ao mês`}
          icon={<Coins className="size-5" />}
        />
      </div>

      <Card className="gap-0 border-brand/20 bg-surface/80 shadow-[0_24px_80px_rgb(var(--surface-rgb)/.35)]">
        <CardHeader>
          <CardTitle id="simulation-result" className="text-xl text-content-strong">
            Evolução do patrimônio
          </CardTitle>
          <p className="text-sm leading-6 text-content">
            Compare o crescimento acumulado com o valor que saiu do seu bolso.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="chart">
            <TabsList className="mb-4 grid w-full grid-cols-2 sm:w-72">
              <TabsTrigger value="chart">Gráfico</TabsTrigger>
              <TabsTrigger value="table">Tabela</TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <CompoundInterestChart points={simulation.points} />
            </TabsContent>
            <TabsContent value="table">
              <CompoundInterestTable points={simulation.points} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
