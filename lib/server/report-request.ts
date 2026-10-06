import { parseReportPeriod } from "@/lib/report-periods";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";

export function readReportRequest(request: Request) {
  const params = new URL(request.url).searchParams;
  return { params, selection: parseReportPeriod(Object.fromEntries(params), getFinanceDefaultMonth()) };
}
