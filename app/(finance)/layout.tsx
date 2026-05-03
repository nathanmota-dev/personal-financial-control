import { Suspense } from "react";

import { AppShell } from "@/components/finance/app-shell";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>}
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
