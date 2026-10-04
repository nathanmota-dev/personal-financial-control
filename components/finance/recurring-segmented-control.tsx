import { CalendarDays,ChartPie,Repeat2 } from "lucide-react";

import { TabsList,TabsTrigger } from "@/components/ui/tabs";

export function RecurringSegmentedControl() {
  return (
    <TabsList
      aria-label="Visualização das recorrências"
      variant="line"
      className="max-w-full justify-start overflow-x-auto"
    >
      <TabsTrigger
        value="recurring"
        className="shrink-0 px-3 text-xs sm:text-sm"
      >
        <Repeat2 className="size-4" />
        <span>Recorrências</span>
      </TabsTrigger>
      <TabsTrigger
        value="category"
        className="shrink-0 px-3 text-xs sm:text-sm"
      >
        <ChartPie className="size-4" />
        <span>Gastos por categoria</span>
      </TabsTrigger>
      <TabsTrigger
        value="calendar"
        className="shrink-0 px-3 text-xs sm:text-sm"
      >
        <CalendarDays className="size-4" />
        <span>Calendário</span>
      </TabsTrigger>
    </TabsList>
  );
}
