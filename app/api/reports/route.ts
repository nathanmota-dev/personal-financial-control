import { apiGuard } from "@/lib/auth/server";
import { parseReportPeriod } from "@/lib/report-periods";
import { getReportView } from "@/lib/server/reports";
import { privateRoute, rejectRouteMethod } from "@/lib/server/route-response";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const selection = parseReportPeriod(Object.fromEntries(params), getFinanceDefaultMonth());
  const view = params.get("view");
  if (!selection || (view !== "categories" && view !== "sources")) {
    return Response.json({ error: "Período ou visualização inválidos." }, { status: 400 });
  }
  try {
    return Response.json(await getReportView(selection, view));
  } catch {
    return Response.json({ error: "Não foi possível carregar os dados do relatório." }, { status: 500 });
  }
}

export const GET = privateRoute(handleGET);
export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
