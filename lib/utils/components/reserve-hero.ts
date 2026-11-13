import { CalendarClock, Flag, Landmark, Percent, TrendingUp } from "lucide-react";

import { formatDateLabel, formatRateFromBps } from "@/lib/finance-ui";
import type { InvestmentProjection } from "@/lib/interfaces/investments";
import type { ReserveHeroContent, ReserveHeroFormat as Format, ReserveHeroStat } from "@/lib/interfaces/reserve-hero";

function nextContribution(projection: InvestmentProjection | null): ReserveHeroStat {
  return { label: "Próximo aporte previsto", value: projection?.nextContributionDate ? formatDateLabel(projection.nextContributionDate) : "Nenhum", hint: projection ? "Pelo aporte mensal da reserva" : "Use uma recorrência para planejar", icon: CalendarClock };
}

function bankDescription(bank: NonNullable<InvestmentProjection["bank"]>) {
  const date = formatDateLabel(bank.valueAsOf);
  if (bank.configuredReserveCents === null) return `Posições informadas pelo banco em ${date}. Defina em Investimentos quanto delas é reserva.`;
  if (bank.exceedsTotal) return `O total informado pelo banco em ${date} ficou abaixo da reserva definida, então ela mostra o total.`;
  return `Valor definido em Investimentos sobre as posições informadas pelo banco em ${date}.`;
}

/** With linked positions every figure is real: the amount set, the realized rate and the bank's total. */
function bankHero(projection: InvestmentProjection, bank: NonNullable<InvestmentProjection["bank"]>, format: Format): ReserveHeroContent {
  const realized = bank.realizedYield;
  return {
    title: "Saldo da reserva",
    description: bankDescription(bank),
    stats: [
      { label: "Rendimento no mês", value: realized ? format(realized.reserveMonthlyYieldCents) : "—", hint: realized ? `Pela rentabilidade real de ${realized.periodDays} ${realized.periodDays === 1 ? "dia" : "dias"}` : "Aguardando mais sincronizações", icon: TrendingUp },
      nextContribution(projection),
      { label: "Rentabilidade real", value: realized ? formatRateFromBps(realized.monthlyRateBps) : "—", hint: "Ao mês, pelos saldos do banco", icon: Percent },
      { label: "Total investido", value: format(bank.totalCents), hint: "Reserva + carteira, pelo banco", icon: Landmark },
    ],
  };
}

export function buildReserveHero(projection: InvestmentProjection | null, format: Format): ReserveHeroContent {
  if (projection?.bank) return bankHero(projection, projection.bank, format);
  return {
    title: "Saldo estimado hoje",
    description: projection ? `Conferido em ${formatDateLabel(projection.checkpointDate)} e atualizado pela taxa e pelos lançamentos.` : "Configure o saldo de referência em Configurações › Investimentos para acompanhar a reserva.",
    stats: [
      { label: "Rendimento estimado", value: format(projection?.estimatedInterestCents ?? 0), hint: projection ? `Desde ${formatDateLabel(projection.checkpointDate)}` : "Calculado entre conferências", icon: TrendingUp },
      nextContribution(projection),
      { label: "Taxa esperada", value: projection ? formatRateFromBps(projection.expectedMonthlyRateBps) : "—", hint: "Usada na estimativa diária", icon: Percent },
      { label: "Saldo de referência", value: projection ? format(projection.checkpointBalanceCents) : "—", hint: projection ? formatDateLabel(projection.checkpointDate) : "Sem conferência", icon: Flag },
    ],
  };
}
