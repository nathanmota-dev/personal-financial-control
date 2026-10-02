import { requirePageSession } from "@/lib/auth/server";
import { Suspense } from "react";
import { connection } from "next/server";

import { AppShell } from "@/components/finance/app-shell";
import { getServerEnv } from "@/lib/env";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  await connection();
  await requirePageSession();
  const { DEMO_MODE: demoMode } = getServerEnv();

  return (
    <Suspense
      fallback={<div className="min-h-screen bg-surface text-content-strong">{children}</div>}
    >
      <AppShell demoMode={demoMode}>{children}</AppShell>
    </Suspense>
  );
}
