"use client";

import { useFinancialPrivacy } from "@/components/finance/privacy/privacy-context";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadReportCsv } from "@/lib/report-download";
import type { ReportPeriod } from "@/lib/interfaces/reports";
import type { ReportExportKind } from "@/lib/interfaces/report-export";

export function ReportExportActions({ mode, period }: ReportPeriod) {
  const { hidden, setHidden } = useFinancialPrivacy();
  const [pending, setPending] = useState<ReportExportKind | null>(null);
  const [error, setError] = useState(false);

  async function exportCsv(kind: ReportExportKind) {
    if (hidden) return;
    setPending(kind);
    setError(false);
    try {
      await downloadReportCsv({ mode, period, kind });
    } catch {
      setError(true);
    } finally {
      setPending(null);
    }
  }

  if (hidden) return <div className="flex flex-wrap items-center gap-3"><p className="text-sm text-content">Exportação indisponível com valores ocultos.</p><Button variant="outline" size="sm" onClick={() => setHidden(false)}>Mostrar valores para exportar</Button></div>;

  return <div className="flex max-w-full flex-wrap items-center gap-3" aria-busy={pending !== null}>
    <Button variant="secondary" className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium" disabled={pending !== null} onClick={() => exportCsv("summary")}><Download className="size-[17px]" />{pending === "summary" ? "Gerando resumo…" : "Exportar resumo"}</Button>
    <Button variant="secondary" className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium" disabled={pending !== null} onClick={() => exportCsv("categories")}><Download className="size-[17px]" />{pending === "categories" ? "Gerando categorias…" : "Exportar categorias"}</Button>
    {error && <p role="alert" className="w-full text-sm text-destructive">Não foi possível exportar o relatório. Tente novamente.</p>}
  </div>;
}
