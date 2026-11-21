import { CalendarClock, ShieldCheck } from "lucide-react";
import { LoginPreviewMoney } from "@/components/auth/login-preview-money";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";

const stats = [
  { label: "Reserva livre", value: "R$ 8.000,00", hint: "Fora de qualquer meta", icon: ShieldCheck },
  { label: "Aporte mensal", value: "R$ 625,00", hint: "Para cumprir os prazos", icon: CalendarClock },
] as const;

/** Mirrors the goals page "Alocado em metas" card. */
export function LoginPreviewGoals() {
  return <>
    <DashboardCardIllustration src="/images/goals-target.webp" className="top-4 right-5 size-[80px]" />
    <h3 className="text-sm font-semibold text-content-strong">Alocado em metas</h3>
    <LoginPreviewMoney value="R$ 11.000" cents=",00" className="mt-4" />
    <p className="mt-2 pr-20 text-xs text-content">Parte da carteira que já está reservada para objetivos futuros.</p>
    <div className="mt-6 flex items-end justify-between gap-3">
      <p className="text-xs text-content">Progresso geral das metas</p>
      <p className="text-sm font-semibold tabular-nums text-content-strong">69%</p>
    </div>
    <div className="tone-stripes tone-neutral mt-2 h-2.5 overflow-hidden rounded-full"><div className="h-full w-[69%] rounded-full bg-primary" /></div>
    <p className="mt-1.5 flex justify-between gap-3 text-[11px] text-content-subtle"><span>Alocado R$ 11.000,00</span><span>de R$ 16.000,00</span></p>
    <dl className="mt-5 grid grid-cols-2 gap-x-6 border-t border-border pt-5">
      {stats.map(({ label, value, hint, icon: Icon }) => <div key={label} className="min-w-0">
        <dt className="flex items-center gap-1.5 text-xs text-content"><Icon className="size-3.5 shrink-0" />{label}</dt>
        <dd className="mt-1 text-[15px] font-semibold text-content-strong">{value}</dd>
        <p className="mt-0.5 text-[11px] text-content-subtle">{hint}</p>
      </div>)}
    </dl>
  </>;
}
