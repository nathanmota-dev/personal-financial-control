import { formatCreditCardMonth } from "@/lib/credit-card-view";
import type { CreditCardMonthLoadingProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardMonthLoading({ month }: CreditCardMonthLoadingProps) {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only" role="status" aria-live="polite">
        Carregando fatura de {formatCreditCardMonth(month)}.
      </span>
      <div
        className="overflow-hidden rounded-[2rem] border border-border/90 bg-surface-raised/90 shadow-[0_28px_90px_rgb(var(--surface-rgb) / .32)]"
        aria-hidden="true"
      >
        <div className="border-b border-border/80 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center gap-4">
            <div className="size-12 animate-pulse rounded-2xl bg-brand/15" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-36 animate-pulse rounded-full bg-brand/20" />
              <div className="h-7 w-48 max-w-full animate-pulse rounded-full bg-surface-elevated" />
              <div className="h-3 w-56 max-w-full animate-pulse rounded-full bg-surface-raised" />
            </div>
          </div>
        </div>
        <div className="grid gap-8 px-5 py-7 sm:px-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div className="space-y-4">
            <div className="h-4 w-36 animate-pulse rounded-full bg-surface-elevated" />
            <div className="h-14 w-64 max-w-full animate-pulse rounded-2xl bg-brand/15" />
            <div className="flex flex-wrap gap-4">
              <div className="h-4 w-40 animate-pulse rounded-full bg-surface-raised" />
              <div className="h-4 w-28 animate-pulse rounded-full bg-surface-raised" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="h-28 animate-pulse rounded-2xl border border-border/80 bg-surface/40" />
            <div className="h-24 animate-pulse rounded-2xl border border-border/80 bg-surface/40" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div className="min-h-[25rem] animate-pulse rounded-[2rem] border border-border/90 bg-surface-raised/75 p-5 sm:p-6">
          <div className="space-y-3 border-b border-border/70 pb-5">
            <div className="h-6 w-48 max-w-full rounded-full bg-surface-elevated" />
            <div className="h-4 w-72 max-w-full rounded-full bg-surface-raised" />
            <div className="h-10 rounded-xl bg-surface/70" />
          </div>
          <div className="mt-5 space-y-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="size-10 shrink-0 rounded-xl bg-brand/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded-full bg-surface-elevated" />
                  <div className="h-3 w-1/3 rounded-full bg-surface-raised" />
                </div>
                <div className="h-4 w-16 rounded-full bg-surface-elevated" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5" aria-hidden="true">
          <div className="h-64 animate-pulse rounded-[2rem] border border-border/90 bg-surface-raised/75 p-5">
            <div className="h-6 w-40 rounded-full bg-surface-elevated" />
            <div className="mt-5 space-y-3">
              <div className="h-14 rounded-xl bg-surface/60" />
              <div className="h-14 rounded-xl bg-surface/60" />
              <div className="h-14 rounded-xl bg-surface/60" />
            </div>
          </div>
          <div className="h-72 animate-pulse rounded-[2rem] border border-border/90 bg-surface-raised/75 p-5">
            <div className="h-6 w-44 rounded-full bg-surface-elevated" />
            <div className="mt-6 space-y-5">
              <div className="h-12 rounded-xl bg-surface/60" />
              <div className="h-12 rounded-xl bg-surface/60" />
              <div className="h-12 rounded-xl bg-surface/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
