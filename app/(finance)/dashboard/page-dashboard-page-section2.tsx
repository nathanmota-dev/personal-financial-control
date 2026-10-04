import {
formatCurrency
} from "@/lib/finance-ui";
import type { DashboardPageSection2Props } from "@/lib/interfaces/render/page-dashboard-page-section2";
import { CircleAlert } from "lucide-react";
import Link from "next/link";

export function DashboardPageSection2({ resolved, month }: DashboardPageSection2Props) {
  return (
<section className="rounded-[20px] border border-warning/20 bg-warning-soft">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
                <CircleAlert className="size-5" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-warning">
                  Há despesas sem categoria
                </p>
                <p className="mt-1 text-sm leading-6 text-warning/70">
                  {formatCurrency(
                    resolved.dashboard.totals.uncategorizedExpenseCents,
                  )}{" "}
                  em despesas ainda aguardam organização. Elas já reduzem o
                  saldo livre.
                </p>
              </div>
            </div>
            <Link
              href={`/transactions?month=${month}&uncategorized=true`}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 px-4 text-sm font-semibold text-warning transition-colors hover:bg-warning/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/40"
            >
              Categorizar agora
            </Link>
          </div>
        </section>
  );
}
