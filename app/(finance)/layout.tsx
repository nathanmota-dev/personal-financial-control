import { AppShell } from "@/components/finance/app-shell";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
