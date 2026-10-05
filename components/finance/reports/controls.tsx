import Link from "next/link";
import { reportHref } from "@/lib/report-periods";
import type { ReportControlsProps } from "@/lib/interfaces/reports";

export function ReportControls({ mode, period, previousPeriod, nextPeriod }: ReportControlsProps) {
  return <div className="space-y-4">
    <nav aria-label="Modo do relatório" className="flex gap-4 text-sm">
      <Link aria-current={mode === "monthly" ? "page" : undefined} className="text-brand underline" href={reportHref("monthly", mode === "monthly" ? period : `${period}-01`)}>Mensal</Link>
      <Link aria-current={mode === "annual" ? "page" : undefined} className="text-brand underline" href={reportHref("annual", period.slice(0, 4))}>Anual</Link>
    </nav>
    <form action="/reports" className="flex flex-wrap items-end gap-3 text-sm">
      <input type="hidden" name="mode" value={mode} />
      <label className="grid gap-1">Período<input key={`${mode}-${period}`} className="rounded-lg border bg-card p-2" type={mode === "monthly" ? "month" : "number"} name="period" defaultValue={period} min={mode === "annual" ? "2" : "0002-01"} max={mode === "annual" ? "9998" : "9998-12"} required /></label>
      <button className="rounded-lg bg-brand px-4 py-2 text-white">Consultar</button>
    </form>
    <nav aria-label="Navegar entre períodos" className="flex flex-wrap gap-4 text-sm text-brand">
      <Link href={reportHref(mode, previousPeriod)}>Período anterior</Link>
      <Link href={reportHref(mode, nextPeriod)}>Próximo período</Link>
    </nav>
  </div>;
}
