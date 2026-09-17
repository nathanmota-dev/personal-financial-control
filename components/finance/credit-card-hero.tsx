import { CalendarClock, CheckCircle2, CreditCard, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import type { CreditCardHeroProps } from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";

export function CreditCardHero({ overview, nextInvoice }: CreditCardHeroProps) {
  const isPaid = overview.invoice.bill?.status === "paid";
  const paidLabel = overview.invoice.bill?.paidAt
    ? `Paga em ${formatDateLabel(overview.invoice.bill.paidAt)}`
    : "Fatura paga";
  const dueLabel = overview.invoice.bill?.dueDate
    ? formatDateLabel(overview.invoice.bill.dueDate)
    : `dia ${overview.account.creditDueDay}`;

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-slate-800/90 bg-[#0d1523] shadow-[0_28px_90px_rgba(2,6,23,0.42)]">
      <div className="pointer-events-none absolute -right-24 -top-36 -z-10 size-[28rem] rounded-full bg-sky-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 left-1/3 -z-10 size-[24rem] rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="border-b border-slate-800/90 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex size-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-300 shadow-[0_0_30px_rgba(56,189,248,0.12)]">
              <CreditCard className="size-6" strokeWidth={1.7} />
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-sky-300/80">
                Fatura selecionada · {formatCreditCardMonth(overview.month)}
              </p>
              <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                {overview.account.name}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Fecha dia {overview.account.creditClosingDay ?? "—"} · vence dia {overview.account.creditDueDay}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "w-fit rounded-full px-3 py-1 text-xs",
              isPaid
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/30 bg-amber-400/10 text-amber-300"
            )}
          >
            <CheckCircle2 className="mr-1 size-3.5" />
            {isPaid ? "Fatura paga" : "Em aberto"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 px-5 py-7 sm:px-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div>
          <p className="text-sm text-slate-400">Valor total da fatura</p>
          <p className="mt-2 font-heading text-5xl font-semibold tracking-[-0.055em] text-slate-50 sm:text-6xl">
            {formatCurrency(overview.invoice.totalAmountCents)}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="size-4 text-sky-300" />
              {isPaid ? paidLabel : `Vence em ${dueLabel}`}
            </span>
            <span className="inline-flex items-center gap-2">
              <ReceiptText className="size-4 text-sky-300" />
              {overview.invoice.purchaseCount} {overview.invoice.purchaseCount === 1 ? "compra" : "compras"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <HeroDetail
            label="Próxima fatura"
            value={nextInvoice?.entryCount ? formatCurrency(nextInvoice.totalCents) : "—"}
            detail={nextInvoice?.entryCount ? `Estimativa para ${nextInvoice.month.slice(5, 7)}/${nextInvoice.month.slice(0, 4)}` : "Sem parcelas futuras"}
          />
          <HeroDetail
            label="Compras e parcelas"
            value={String(overview.invoice.purchaseCount)}
            detail={overview.invoice.bill ? "Leitura baseada na fatura fechada" : "Leitura baseada nos lançamentos"}
          />
        </div>
      </div>
    </section>
  );
}

function HeroDetail({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-950/35 px-4 py-3.5">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-sky-200">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
