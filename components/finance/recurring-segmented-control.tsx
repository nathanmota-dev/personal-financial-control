import { CalendarDays, ChartPie, Repeat2 } from "lucide-react";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RecurringSegmentedControl() {
  return (
    <TabsList
      aria-label="Visualização das recorrências"
      className="!flex !h-auto w-full overflow-x-auto rounded-[1.35rem] border border-slate-800 bg-slate-950/80 p-1.5 shadow-[0_18px_50px_rgba(2,6,23,0.28)]"
    >
      <TabsTrigger
        value="recurring"
        className="h-auto min-h-10 min-w-[9.5rem] flex-1 rounded-xl px-4 py-3 text-xs leading-5 text-slate-400 hover:text-slate-100 sm:text-sm data-[state=active]:bg-cyan-300 data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_8px_24px_rgba(34,211,238,0.2)]"
      >
        <Repeat2 className="size-4" />
        <span>Recorrências</span>
      </TabsTrigger>
      <TabsTrigger
        value="category"
        className="h-auto min-h-10 min-w-[9.5rem] flex-1 rounded-xl px-4 py-3 text-xs leading-5 text-slate-400 hover:text-slate-100 sm:text-sm data-[state=active]:bg-cyan-300 data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_8px_24px_rgba(34,211,238,0.2)]"
      >
        <ChartPie className="size-4" />
        <span>Gastos por categoria</span>
      </TabsTrigger>
      <TabsTrigger
        value="calendar"
        className="h-auto min-h-10 min-w-[9.5rem] flex-1 rounded-xl px-4 py-3 text-xs leading-5 text-slate-400 hover:text-slate-100 sm:text-sm data-[state=active]:bg-cyan-300 data-[state=active]:text-slate-950 data-[state=active]:shadow-[0_8px_24px_rgba(34,211,238,0.2)]"
      >
        <CalendarDays className="size-4" />
        <span>Calendário</span>
      </TabsTrigger>
    </TabsList>
  );
}
