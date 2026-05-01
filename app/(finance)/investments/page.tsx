import { InvestmentsView } from "@/components/finance/investments-view";
import { getInvestmentProjection } from "@/lib/server/investments";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const customMonthsRaw = typeof params.customMonths === "string" ? Number(params.customMonths) : 24;
  const customMonths = Number.isFinite(customMonthsRaw) && customMonthsRaw > 0 ? customMonthsRaw : 24;
  let projection: Awaited<ReturnType<typeof getInvestmentProjection>> | undefined;
  let errorMessage: string | undefined;

  try {
    projection = await getInvestmentProjection(customMonths);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Falha desconhecida ao ler os dados.";
  }

  return (
    <InvestmentsView
      customMonths={customMonths}
      projection={projection ?? null}
      warning={errorMessage}
    />
  );
}
