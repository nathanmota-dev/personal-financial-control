import { requirePageSession } from "@/lib/auth/server";
import { Suspense } from "react";
import { connection } from "next/server";

import { AppShell } from "@/components/finance/app-shell";
import { getServerEnv } from "@/lib/env";
import type { FinanceLayoutProps } from "@/lib/interfaces/app-shell";

export default async function FinanceLayout({ children }: FinanceLayoutProps) {
  await connection();
  const session = await requirePageSession();
  const user = {
    name: typeof session.name === "string" && session.name.trim() ? session.name : "Usuário",
    photoURL: typeof session.picture === "string" ? session.picture : null,
  };
  const { DEMO_MODE: demoMode } = getServerEnv();

  return (
    <Suspense
      fallback={<div className="min-h-screen bg-surface text-content-strong">{children}</div>}
    >
      <AppShell demoMode={demoMode} user={user}>{children}</AppShell>
    </Suspense>
  );
}
