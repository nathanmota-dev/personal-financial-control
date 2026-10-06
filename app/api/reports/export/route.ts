import { apiGuard } from "@/lib/auth/server";
import { buildReportCsv } from "@/lib/report-csv";
import { reportCsvFilename } from "@/lib/report-periods";
import { readReportRequest } from "@/lib/server/report-request";
import { getReport } from "@/lib/server/reports";
import { privateRoute, rejectRouteMethod } from "@/lib/server/route-response";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  const { selection, params } = readReportRequest(request);
  const kind = params.get("kind");
  if (!selection || (kind !== "summary" && kind !== "categories")) {
    return Response.json({ error: "Período ou exportação inválidos." }, { status: 400 });
  }
  try {
    const csv = buildReportCsv(await getReport(selection), kind);
    return new Response(csv, { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportCsvFilename({ ...selection, kind })}"`,
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return Response.json({ error: "Não foi possível gerar a exportação. Tente novamente." }, { status: 500 });
  }
}

export const GET = privateRoute(handleGET);
export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
