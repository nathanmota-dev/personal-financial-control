import {
formatCurrency,
formatDateLabel
} from "@/lib/finance-ui";
import type { DashboardDetailsSection2Props } from "@/lib/interfaces/render/dashboard-details-dashboard-details-section2";

export function DashboardDetailsSection2({ projection }: DashboardDetailsSection2Props) {
  return (
<section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 xl:h-[238px]">
          <h2 className="text-lg font-semibold">Carteira consolidada</h2>
          <p className="mt-1 text-xs text-content-muted">
            Estimativa atual dos investimentos
          </p>
          {projection ? (
            <>
              <div className="mt-[22px] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-content-muted">
                    Saldo estimado atual
                  </p>
                  <p className="mt-1 text-[25px] font-[650] tracking-[-0.8px]">
                    {formatCurrency(projection.currentBalanceCents)}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-soft px-[13px] py-[9px]">
                  <p className="text-[10px] text-content">
                    Rendimento estimado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand">
                    {projection.estimatedInterestCents > 0 ? "+ " : ""}
                    {formatCurrency(projection.estimatedInterestCents)}
                  </p>
                </div>
              </div>
              <div className="mt-[15px] grid grid-cols-3 gap-2 border-t border-border pt-[13px]">
                <div>
                  <p className="text-[11px] text-content-subtle">Referência</p>
                  <p className="mt-1.5 text-xs font-semibold">
                    {formatDateLabel(projection.checkpointDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-content-subtle">
                    Taxa esperada
                  </p>
                  <p className="mt-1.5 text-xs font-semibold">
                    {(projection.expectedMonthlyRateBps / 100).toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2 },
                    )}
                    % a.m.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-content-subtle">
                    Próximo aporte
                  </p>
                  <p className="mt-1.5 text-xs font-semibold">
                    {projection.nextContributionDate
                      ? formatDateLabel(projection.nextContributionDate)
                      : "Não previsto"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-8 text-sm text-content-muted">
              A carteira ainda não foi configurada.
            </p>
          )}
        </section>
  );
}
