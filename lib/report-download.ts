import type { ReportExportRequest } from "@/lib/interfaces/report-export";
import { reportCsvFilename } from "@/lib/report-periods";

export async function downloadReportCsv(selection: ReportExportRequest) {
  const response = await fetch(`/api/reports/export?${new URLSearchParams(selection)}`, {
    cache: "no-store", credentials: "same-origin", redirect: "error",
  });
  if (!response.ok || response.headers.get("Content-Type")?.split(";")[0] !== "text/csv") {
    throw new Error("Não foi possível gerar a exportação. Tente novamente.");
  }
  const blob = await response.blob();
  if (!blob.size) throw new Error("A exportação está vazia. Tente novamente.");
  const url = URL.createObjectURL(blob);
  const revokeUrl = URL.revokeObjectURL.bind(URL);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = reportCsvFilename(selection);
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    // Keep the object URL alive until the browser has started the download.
    setTimeout(() => revokeUrl(url), 1000);
  }
}
