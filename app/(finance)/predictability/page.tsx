import { requirePageSession } from "@/lib/auth/server";
import { connection } from "next/server";

import { PredictabilityView } from "@/components/finance/predictability/predictability-view";
import type { PredictabilityResult } from "@/lib/interfaces/predictability";
import { DomainError } from "@/lib/server/errors";
import { getPredictability, parsePredictabilityReference } from "@/lib/server/predictability";
import { getFinanceToday } from "@/lib/server/runtime";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function PredictabilityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePageSession();
  await connection();

  const params = await searchParams;
  let predictability: PredictabilityResult | null = null;
  let loadError: string | undefined;

  try {
    predictability = await getPredictability({
      today: getFinanceToday(),
      reference: parsePredictabilityReference(params.cycle),
    });
  } catch (error) {
    loadError =
      error instanceof DomainError
        ? "Ciclo inválido. Use os botões de ciclo anterior e próximo para navegar."
        : "Não foi possível carregar a previsibilidade agora.";
  }

  return <PredictabilityView predictability={predictability} loadError={loadError} />;
}
