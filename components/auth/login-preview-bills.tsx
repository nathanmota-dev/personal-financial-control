import Image from "next/image";
import { LoginPreviewMoney } from "@/components/auth/login-preview-money";

const days = [{ day: "05", bills: 1 }, { day: "10", bills: 3 }, { day: "15", bills: 2 }, { day: "20", bills: 1 }, { day: "25", bills: 1 }] as const;
const bills = [{ name: "Aluguel", value: "R$ 1.200,00" }, { name: "Internet", value: "R$ 120,00" }, { name: "Academia", value: "R$ 330,00" }] as const;

/** Mirrors the dashboard "Contas a pagar" card. */
export function LoginPreviewBills() {
  return <>
    <h3 className="text-sm font-semibold text-content-strong">Contas a pagar <span className="font-normal text-content">• dia 10</span></h3>
    <div className="mt-4 flex items-center justify-between gap-4">
      <LoginPreviewMoney value="R$ 1.650" cents=",00" />
      <div className="relative -my-6 -mr-2 size-20 shrink-0">
        <div className="absolute inset-x-2 -bottom-1 h-4 rounded-[50%] bg-black/50 blur-[7px]" />
        <Image src="/images/bills-calendar.webp" width={450} height={450} alt="" unoptimized className="relative size-full object-contain" />
      </div>
    </div>
    <p className="mt-2 text-xs text-content">em 3 dias · 2 de 8 pagas</p>
    <div className="mt-5 grid grid-cols-5 gap-2">
      {days.map(({ day, bills: count }) => {
        const active = day === "10";
        return <span key={day} className={`flex h-[58px] flex-col items-center justify-center gap-1.5 rounded-[14px] border text-sm font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-content-strong"}`}>
          {day}
          <span className="flex h-1 gap-0.5">{Array.from({ length: count }, (_, index) => <span key={index} className={`size-1 rounded-full ${active ? "bg-primary-foreground/80" : "bg-content/50"}`} />)}</span>
        </span>;
      })}
    </div>
    <ul className="mt-3 divide-y divide-border">
      {bills.map(bill => <li key={bill.name} className="flex items-center gap-3 py-3 text-[13px]">
        <span className="size-[18px] shrink-0 rounded-full border-[1.5px] border-border" />
        <span className="min-w-0 flex-1 truncate text-content-strong">{bill.name}</span>
        <span className="shrink-0 font-semibold text-content-strong">{bill.value}</span>
      </li>)}
    </ul>
  </>;
}
