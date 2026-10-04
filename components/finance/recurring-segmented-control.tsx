import { CalendarDays,ChartPie,Repeat2 } from "lucide-react";

import { TabsList,TabsTrigger } from "@/components/ui/tabs";

export function RecurringSegmentedControl() {
  return (
    <TabsList
      aria-label="Visualização das recorrências"
      className="!flex !h-auto max-w-full justify-start overflow-x-auto rounded-xl border border-border bg-card p-1.5 shadow-none"
    >
      <TabsTrigger
        value="recurring"
        className="h-auto min-h-9 shrink-0 rounded-lg px-4 py-2 text-xs leading-5 text-content hover:text-content-strong sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
      >
        <Repeat2 className="size-4" />
        <span>Recorrências</span>
      </TabsTrigger>
      <TabsTrigger
        value="category"
        className="h-auto min-h-9 shrink-0 rounded-lg px-4 py-2 text-xs leading-5 text-content hover:text-content-strong sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
      >
        <ChartPie className="size-4" />
        <span>Gastos por categoria</span>
      </TabsTrigger>
      <TabsTrigger
        value="calendar"
        className="h-auto min-h-9 shrink-0 rounded-lg px-4 py-2 text-xs leading-5 text-content hover:text-content-strong sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
      >
        <CalendarDays className="size-4" />
        <span>Calendário</span>
      </TabsTrigger>
    </TabsList>
  );
}
