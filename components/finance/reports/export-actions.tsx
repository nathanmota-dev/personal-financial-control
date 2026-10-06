"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadReportCsv } from "@/lib/report-download";
import type { ReportPeriod } from "@/lib/interfaces/reports";
import type { ReportExportKind } from "@/lib/interfaces/report-export";

export function ReportExportActions({ mode, period }: ReportPeriod) {
  const [pending, setPending] = useState<ReportExportKind | null>(null);
  const [error, setError] = useState(false);

  async function exportCsv(kind: ReportExportKind) {
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

  return <div className="flex max-w-full flex-wrap items-center gap-3" aria-busy={pending !== null}>
    <Button variant="outline" size="sm" disabled={pending !== null} onClick={() => exportCsv("summary")}><Download />{pending === "summary" ? "Gerando resumo…" : "Exportar resumo"}</Button>
    <Button variant="outline" size="sm" disabled={pending !== null} onClick={() => exportCsv("categories")}><Download />{pending === "categories" ? "Gerando categorias…" : "Exportar categorias"}</Button>
    {error && <p role="alert" className="w-full text-sm text-destructive">Não foi possível exportar o relatório. Tente novamente.</p>}
  </div>;
}
