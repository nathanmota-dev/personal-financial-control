import Link from "next/link";
import { requirePageSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/finance/page-header";
import { ReportControls } from "@/components/finance/reports/controls";
import { ReportExportActions } from "@/components/finance/reports/export-actions";
import { ReportNotes } from "@/components/finance/reports/notes";
import { ReportTables } from "@/components/finance/reports/tables";
import type { DashboardPageProps } from "@/lib/interfaces/dashboard";
import { parseReportPeriod } from "@/lib/report-periods";
import { getReportInitial } from "@/lib/server/reports";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";

export default async function ReportsPage({ searchParams }: DashboardPageProps) {
  await requirePageSession();
  const params = await searchParams;
  const defaultMonth = getFinanceDefaultMonth();
  const selection = parseReportPeriod(params, defaultMonth);
  const remembered = parseReportPeriod({ mode: "monthly", period: params.month }, defaultMonth);
  if (!selection) return <section role="alert" className="space-y-4"><h1 className="text-2xl font-semibold">Período inválido</h1><p>Use modo mensal com AAAA-MM ou anual com AAAA, entre os anos 0002 e 9998.</p><Link className="text-brand underline" href="/reports">Consultar período atual</Link></section>;
  const report = await getReportInitial(selection);
  return <div className="space-y-6 min-[100.0625rem]:space-y-5">
    <PageHeader title="Relatórios" description="Consulte o histórico por competência e entenda o resultado antes e depois dos investimentos." actions={<ReportControls {...selection} defaultMonth={defaultMonth} rememberedMonth={remembered?.period} />} />
    <ReportExportActions key={`export:${selection.mode}:${selection.period}`} {...selection} />
    <ReportTables key={`${selection.mode}:${selection.period}`} report={report} />
    <ReportNotes report={report} />
  </div>;
}
