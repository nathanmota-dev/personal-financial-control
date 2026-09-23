import { financePanelClassName } from "@/components/finance/finance-styles";
import { ReserveFigure } from "@/components/finance/reserve-figure";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import type { EmergencyReserveCompositionProps } from "@/lib/interfaces/investment-reserve";

export function EmergencyReserveComposition({ composition }: EmergencyReserveCompositionProps) {
  return <section className={`${financePanelClassName} overflow-hidden`}>
    <div className="grid gap-4 border-b border-border p-5 sm:grid-cols-3"><ReserveFigure label="Saldo oficial" value={composition.officialBalanceCents} /><ReserveFigure label="Composição cadastrada" value={composition.registeredCents} /><ReserveFigure label="Diferença de conciliação" value={composition.differenceCents} /></div>
    <div className="p-5"><h2 className="font-semibold text-content-strong">Composição líquida da reserva</h2><p className="mt-1 text-sm text-content-muted">Estes ativos explicam o saldo oficial; não são somados novamente ao patrimônio.</p></div>
    <div className="divide-y divide-border">{composition.holdings.length ? composition.holdings.map((holding) => <div key={holding.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium text-content-strong">{holding.name}</p><p className="text-xs text-content-muted">{holding.institutionName ?? "Instituição não informada"} · {formatDateLabel(holding.valueAsOf)}</p></div><p className="font-mono">{formatCurrency(holding.amountCents)}</p></div>) : <p className="p-8 text-center text-sm text-content-muted">Nenhum ativo líquido foi dedicado integralmente à reserva.</p>}</div>
  </section>;
}
