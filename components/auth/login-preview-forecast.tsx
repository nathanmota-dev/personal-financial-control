import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { LoginPreviewMoney } from "@/components/auth/login-preview-money";

const segments = [
  { label: "Gastos fixos", value: "− R$ 1.600,00", percent: 33, color: "bg-chart-5" },
  { label: "Gastos variáveis", value: "− R$ 1.050,00", percent: 22, color: "bg-chart-1" },
  { label: "Investimentos", value: "− R$ 1.000,00", percent: 21, color: "bg-chart-3" },
  { label: "= Saldo livre", value: "R$ 1.150,00", percent: 24, color: "bg-success" },
] as const;

/** Mirrors the dashboard "Saldo previsto" card. */
export function LoginPreviewForecast() {
  return <>
    <h3 className="text-sm font-semibold text-content-strong">Saldo previsto</h3>
    <div className="mt-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <LoginPreviewMoney value="R$ 1.150" cents=",00" />
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-success"><ArrowUpRight className="size-3.5" />24% da receita livre</p>
        <p className="text-xs text-content">valor estimado após pagar todas as contas</p>
      </div>
      <div className="relative -mt-3 -mr-2 size-20 shrink-0">
        <div className="absolute inset-x-1 -bottom-1 h-4 rounded-[50%] bg-black/50 blur-[7px]" />
        <Image src="/images/balance-wallet.webp" width={450} height={450} alt="" unoptimized className="relative size-full -rotate-[24deg] skew-x-[-8deg] object-contain" />
      </div>
    </div>
    <div className="mt-6 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface">{segments.map(segment => <div key={segment.label} className={`h-full ${segment.color}`} style={{ width: `${segment.percent}%` }} />)}</div>
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
      {segments.map(segment => <div key={segment.label}>
        <dt className="flex items-center gap-1.5 text-xs text-content"><span className={`size-2 shrink-0 rounded-full ${segment.color}`} />{segment.label}</dt>
        <dd className="mt-1 text-[15px] font-semibold text-content-strong">{segment.value}<span className="ml-1.5 text-[11px] font-normal text-content-subtle">{segment.percent}%</span></dd>
      </div>)}
    </dl>
  </>;
}
