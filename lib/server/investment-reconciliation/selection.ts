import type {
InvestmentReductionSelection,
InvestmentReductionSource,
InvestmentReductionSourcesResult,
} from "@/lib/interfaces/investment-reconciliation";
import { invariant } from "@/lib/server/errors";
import { SourceSelectionInput } from "./validation";

export function sourceMap(result: InvestmentReductionSourcesResult) {
  return new Map(result.sources.map((source) => [source.id, source]));
}

export function ensureSelectionsClose(
  amountCents: number,
  selections: InvestmentReductionSelection[]
) {
  const totalSelectedCents = selections.reduce((total, selection) => total + selection.amountCents, 0);

  invariant(
    totalSelectedCents === amountCents,
    "INVESTMENT_REDUCTION_DOES_NOT_CLOSE",
    `A distribuição de fontes deve fechar exatamente ${amountCents} centavos.`
  );

  const ids = new Set<string>();
  for (const selection of selections) {
    invariant(
      !ids.has(selection.sourceId),
      "INVESTMENT_REDUCTION_DUPLICATE_SOURCE",
      "A mesma fonte não pode ser selecionada duas vezes."
    );
    ids.add(selection.sourceId);
  }
}

export function ensureSourceAmounts(
  selections: InvestmentReductionSelection[],
  sources: InvestmentReductionSourcesResult
) {
  const availableById = sourceMap(sources);

  for (const selection of selections) {
    const source = availableById.get(selection.sourceId);
    invariant(
      source,
      "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND",
      "Uma das fontes selecionadas não está mais disponível. Atualize a página e tente novamente."
    );
    invariant(
      selection.amountCents <= source.availableCents,
      "INVESTMENT_REDUCTION_EXCEEDS_SOURCE",
      `A fonte ${source.label} não possui saldo suficiente para esta redução.`
    );
  }
}

export function hasRegisteredSources(sources: InvestmentReductionSource[]) {
  return sources.some((source) => source.sourceType !== "not_registered");
}

export function selectionSourceType(
  selection: InvestmentReductionSelection & {
    sourceType?: SourceSelectionInput["sourceType"];
  },
  source: InvestmentReductionSource
) {
  return selection.sourceType ?? source.sourceType;
}
