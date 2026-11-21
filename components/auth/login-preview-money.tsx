import type { LoginPreviewMoneyProps } from "@/lib/interfaces/login-preview";
import { cn } from "@/lib/utils";

/** Static version of DashboardCardsMoney: big whole part, small cents. */
export function LoginPreviewMoney({ value, cents, className }: LoginPreviewMoneyProps) {
  return <span className={cn("block text-[40px] leading-[44px] font-bold tracking-tight text-content-strong", className)}>{value}<span className="text-[0.4em] font-semibold">{cents}</span></span>;
}
