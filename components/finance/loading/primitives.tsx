import { Skeleton } from "@/components/ui/skeleton";
import type { LoadingBlockProps, LoadingPageProps, LoadingRepeatProps, LoadingRowsProps } from "@/lib/interfaces/loading";
import { cn } from "@/lib/utils";

export function LoadingBar({ className }: LoadingBlockProps) {
  return <Skeleton className={cn("h-4 max-w-full rounded-full bg-surface-elevated motion-reduce:animate-none", className)} />;
}

export function LoadingPage({ label, actions = 0, className, children }: LoadingPageProps) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true">
      <span className="sr-only" role="status">Carregando {label}.</span>
      <div aria-hidden="true" className="space-y-6">
        <header className="flex min-h-[104px] flex-wrap items-start justify-between gap-x-8 gap-y-4 pt-[17px] pb-2">
          <div className="min-w-0 flex-1 basis-[320px] space-y-2">
            <LoadingBar className="h-11 w-72" />
            <LoadingBar className="h-4 w-full max-w-2xl bg-surface-raised" />
          </div>
          {actions > 0 && <div className="flex max-w-full flex-wrap gap-3 pt-[5px]">
            {Array.from({ length: actions }, (_, index) => <LoadingBar key={index} className="h-9 w-32 rounded-lg" />)}
          </div>}
        </header>
        {children}
      </div>
    </div>
  );
}

export function LoadingPanel({ children, className }: LoadingBlockProps) {
  return <div className={cn("min-w-0 space-y-5 rounded-[20px] border border-border bg-card p-6", className)}>
    <div className="space-y-2"><LoadingBar className="h-6 w-48" /><LoadingBar className="h-3 w-64 bg-surface-raised" /></div>
    {children}
  </div>;
}

export function LoadingMetrics({ count, className }: LoadingRepeatProps) {
  return <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>
    {Array.from({ length: count }, (_, index) => <div key={index} className="min-w-0 space-y-4 rounded-[20px] border border-border bg-card p-5">
      <LoadingBar className="w-28" /><LoadingBar className="h-8 w-36" /><LoadingBar className="h-3 w-full bg-surface-raised" />
    </div>)}
  </div>;
}

export function LoadingFields({ count, className }: LoadingRepeatProps) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
    {Array.from({ length: count }, (_, index) => <div key={index} className="min-w-0 space-y-2">
      <LoadingBar className="h-3 w-24" /><LoadingBar className="h-10 w-full rounded-xl bg-surface-raised" />
    </div>)}
  </div>;
}

export function LoadingRows({ count, columns = 4, className }: LoadingRowsProps) {
  return <div className={cn("divide-y divide-border", className)}>
    {Array.from({ length: count }, (_, index) => <div key={index} className="flex flex-wrap items-center gap-4 py-5">
      <div className="min-w-0 flex-[2] space-y-2"><LoadingBar className="w-40" /><LoadingBar className="h-3 w-24 bg-surface-raised" /></div>
      {Array.from({ length: columns - 1 }, (_, column) => <LoadingBar key={column} className="w-16 flex-1" />)}
    </div>)}
  </div>;
}

export function LoadingTabs({ count }: LoadingRepeatProps) {
  return <div className="flex flex-wrap gap-3 border-b border-border pb-3">
    {Array.from({ length: count }, (_, index) => <LoadingBar key={index} className="h-8 w-28 rounded-lg" />)}
  </div>;
}

export function LoadingChart({ className }: LoadingBlockProps) {
  return <LoadingPanel><LoadingBar className={cn("h-[300px] w-full rounded-xl bg-surface-raised", className)} /></LoadingPanel>;
}
