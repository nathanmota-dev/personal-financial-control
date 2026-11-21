import { LoadingBar } from "@/components/finance/loading/primitives";

export function LockSkeleton() {
  return <main className="flex min-h-svh items-center justify-center bg-surface p-4 sm:p-8 lg:p-12" aria-busy="true">
    <span role="status" className="sr-only">Carregando o bloqueio do Finance.</span>
    <div aria-hidden="true" className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-border bg-surface shadow-elevation lg:min-h-[680px] lg:grid-cols-2">
      <section className="flex min-w-0 flex-col px-5 py-6 sm:px-12 sm:py-9 lg:px-14">
        <div className="flex justify-between"><LoadingBar className="h-8 w-28" /><LoadingBar className="size-9 rounded-xl" /></div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10 lg:py-12">
          <LoadingBar className="h-11 w-72" /><LoadingBar className="mt-2 h-3 w-56" />
          <div className="mt-8">
            <div className="flex items-center gap-3"><LoadingBar className="size-11" /><div className="space-y-2"><LoadingBar className="h-3 w-24" /><LoadingBar className="h-4 w-32" /></div></div>
            <div className="mt-6 border-t border-border pt-5">
              <LoadingBar className="h-2.5 w-10" />
              <div className="mt-3 flex gap-2">{Array.from({ length: 6 }, (_, index) => <LoadingBar key={index} className="h-[58px] flex-1 rounded-[14px]" />)}</div>
              <LoadingBar className="mt-5 h-2.5 w-full" />
              <LoadingBar className="mt-5 h-10 w-full rounded-[10px]" />
            </div>
            <div className="mt-5 flex justify-between border-t border-border pt-4"><LoadingBar className="h-10 w-28 rounded-[10px]" /><LoadingBar className="h-10 w-20 rounded-[10px]" /></div>
          </div>
        </div>
        <LoadingBar className="mx-auto h-3 w-64" />
      </section>
      <section className="bg-hero hidden flex-col justify-center gap-7 px-12 py-12 lg:flex xl:px-16">
        <div className="mx-auto size-[200px] rounded-[40px] bg-white/10 motion-safe:animate-pulse" />
        <div className="space-y-3"><div className="h-8 w-72 rounded-full bg-white/15" /><div className="h-4 w-full rounded-full bg-white/10" /></div>
        <div>
          <div className="h-[170px] rounded-[20px] border border-white/18 bg-white/12" />
          <div className="mt-4 flex h-9 items-center justify-center gap-2"><div className="h-1.5 w-6 rounded-full bg-white/40" /><div className="size-1.5 rounded-full bg-white/25" /><div className="size-1.5 rounded-full bg-white/25" /></div>
        </div>
      </section>
    </div>
  </main>;
}
