"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/finance-ui";

export function DashboardCharts({
  evolution,
  categorySpending,
}: {
  evolution: Array<{
    month: string;
    income: number;
    expenses: number;
    investments: number;
    net: number;
  }>;
  categorySpending: Array<{ categoryName: string; amount: number }>;
}) {
  const topCategories = categorySpending
    .filter((item) => item.amount > 0)
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 6)
    .map((item, index) => ({
      ...item,
      shortLabel:
        item.categoryName.length > 18
          ? `${item.categoryName.slice(0, 18).trimEnd()}...`
          : item.categoryName,
      fill: ["#38bdf8", "#f97316", "#14b8a6", "#f43f5e", "#eab308", "#a78bfa"][index],
    }));

  const hasCategoryData = topCategories.length > 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
        <div className="mb-4">
          <h3 className="font-heading text-lg font-semibold text-slate-100">Evolução mensal</h3>
          <p className="text-sm text-slate-400">Receita, saídas e resultado dos últimos meses.</p>
        </div>
        <ChartContainer
          className="h-[320px] w-full"
          config={{
            income: { label: "Receitas", color: "#0f766e" },
            expenses: { label: "Despesas", color: "#be123c" },
            investments: { label: "Aportes", color: "#0369a1" },
            net: { label: "Líquido", color: "#1e293b" },
          }}
        >
          <AreaChart data={evolution}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <>
                      <span className="text-muted-foreground">{String(name)}</span>
                      <span>{formatCurrency(Number(value) * 100)}</span>
                    </>
                  )}
                />
              }
            />
            <Area type="monotone" dataKey="income" fill="var(--color-income)" fillOpacity={0.18} stroke="var(--color-income)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" fill="var(--color-expenses)" fillOpacity={0.12} stroke="var(--color-expenses)" strokeWidth={2} />
            <Area type="monotone" dataKey="investments" fill="var(--color-investments)" fillOpacity={0.12} stroke="var(--color-investments)" strokeWidth={2} />
            <Area type="monotone" dataKey="net" fill="var(--color-net)" fillOpacity={0.08} stroke="var(--color-net)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="grid gap-6">
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
          <div className="mb-4">
            <h3 className="font-heading text-lg font-semibold text-slate-100">Gastos por categoria</h3>
            <p className="text-sm text-slate-400">Peso relativo das despesas no mês.</p>
          </div>
          {hasCategoryData ? (
            <ChartContainer
              className="h-[220px] w-full"
              config={{
                amount: { label: "Valor", color: "#14b8a6" },
              }}
            >
              <BarChart data={topCategories} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="shortLabel"
                  axisLine={false}
                  tickLine={false}
                  width={112}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(20, 184, 166, 0.08)" }}
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <>
                          <span className="text-muted-foreground">
                            {String(item.payload.categoryName)}
                          </span>
                          <span>{formatCurrency(Number(value) * 100)}</span>
                        </>
                      )}
                    />
                  }
                />
                <Bar dataKey="amount" radius={999} barSize={18}>
                  {topCategories.map((item) => (
                    <Cell key={item.categoryName} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-800 bg-slate-950/40 px-6 text-center text-sm text-slate-400">
              Nenhuma despesa categorizada encontrada para este mês.
            </div>
          )}
        </div>

        <div className="rounded-[1.75rem] border border-slate-800 bg-[#06152d] p-5 text-white shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
          <div className="mb-4">
            <h3 className="font-heading text-lg font-semibold">Distribuição das despesas</h3>
            <p className="text-sm text-slate-300">Leitura rápida das categorias dominantes.</p>
          </div>
          {hasCategoryData ? (
            <ChartContainer
              className="h-[220px] w-full"
              config={{
                a: { label: "1", color: "#38bdf8" },
                b: { label: "2", color: "#f97316" },
                c: { label: "3", color: "#14b8a6" },
                d: { label: "4", color: "#f43f5e" },
                e: { label: "5", color: "#eab308" },
                f: { label: "6", color: "#a78bfa" },
              }}
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <>
                          <span className="text-muted-foreground">
                            {String(item.payload.categoryName)}
                          </span>
                          <span>{formatCurrency(Number(value) * 100)}</span>
                        </>
                      )}
                    />
                  }
                />
                <Pie
                  data={topCategories}
                  dataKey="amount"
                  nameKey="categoryName"
                  innerRadius={48}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  {topCategories.map((item) => (
                    <Cell key={item.categoryName} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center rounded-[1.5rem] border border-white/10 bg-slate-950/20 px-6 text-center text-sm text-slate-300">
              Adicione despesas com categoria para liberar a distribuição visual.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
