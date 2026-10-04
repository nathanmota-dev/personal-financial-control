import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { formatCurrency } from "@/lib/finance-ui";
import type { DashboardUncategorizedNoticeProps } from "@/lib/interfaces/dashboard";

export function DashboardUncategorizedNotice({ amountCents, month }: DashboardUncategorizedNoticeProps) {
  return (<>
      {amountCents > 0 ? (
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
                    amountCents,
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
      ) : null}

  </>);
}
