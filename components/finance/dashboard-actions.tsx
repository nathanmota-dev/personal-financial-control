"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { AccountSetupDialog, CategorySetupDialog } from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";

export function DashboardActions({ month }: { month: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <form className="flex items-center gap-3">
        <input
          type="month"
          name="month"
          defaultValue={month}
          className="h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 shadow-sm outline-none ring-0"
        />
        <Button type="submit" variant="outline">
          Atualizar competência
        </Button>
      </form>
      <AccountSetupDialog />
      <CategorySetupDialog />
      <Button asChild>
        <Link href="/transactions">
          <Plus className="size-4" />
          Novo lançamento
        </Link>
      </Button>
    </div>
  );
}
