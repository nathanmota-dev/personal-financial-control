import { FinanceRouteSkeleton } from "./route-skeleton";

/** Placeholder for the whole app shell (sidebar + content panel) while the finance layout loads. */
export function FinanceShellSkeleton() {
  return (
    <div className="min-h-screen bg-app-shell text-content-strong app-shell-frame">
      <div className="flex min-h-screen">
        <aside aria-hidden="true" className="sidebar-surface hidden w-[238px] shrink-0 lg:block">
          <div className="sticky top-0 flex h-dvh max-h-[1056px] flex-col gap-6 px-5 pt-6 pb-6 motion-safe:animate-pulse">
            <div className="flex items-center gap-[11px] pl-1"><span className="size-[30px] rounded-[7px] bg-white/25" /><span className="h-5 w-20 rounded-full bg-white/25" /></div>
            <span className="h-9 w-full rounded-[10px] bg-white/12" />
            <div className="flex flex-col gap-4 pt-2">
              {Array.from({ length: 12 }, (_, index) => <span key={index} className="flex items-center gap-3 pl-2"><span className="size-4 rounded bg-white/20" /><span className="h-3 rounded-full bg-white/20" style={{ width: `${55 + ((index * 23) % 35)}%` }} /></span>)}
            </div>
            <div className="mt-auto flex items-center gap-3 border-t border-white/15 pt-4"><span className="size-9 rounded-full bg-white/25" /><span className="h-3 w-24 rounded-full bg-white/25" /></div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 bg-surface px-4 py-6 md:px-7 lg:my-2 lg:mr-2 lg:rounded-[28px] lg:border lg:border-border lg:pb-[106px] lg:pl-[29px] lg:pr-[47px] lg:pt-8 lg:shadow-elevation min-[100.0625rem]:pt-12">
          <main className="min-w-0 flex-1">
            <FinanceRouteSkeleton />
          </main>
        </div>
      </div>
    </div>
  );
}
