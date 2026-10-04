import { LoadingBar } from "@/components/finance/loading/primitives";

export function LoginSkeleton() {
  return <main className="flex min-h-svh items-center justify-center bg-surface p-4 sm:p-8 lg:p-12" aria-busy="true">
    <span role="status" className="sr-only">Carregando acesso ao Finance.</span>
    <div aria-hidden="true" className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-border bg-surface-raised shadow-xl shadow-black/5 lg:min-h-[680px] lg:grid-cols-2">
      <section className="flex flex-col px-7 py-7 sm:px-12 sm:py-9 lg:px-16">
        <div className="flex justify-between"><LoadingBar className="h-8 w-28" /><LoadingBar className="size-8" /></div>
        <div className="mx-auto flex w-full max-w-[340px] flex-1 flex-col items-center justify-center gap-5 py-16 lg:py-20">
          <LoadingBar className="h-20 w-72 rounded-xl" /><LoadingBar className="h-16 w-full rounded-lg bg-surface-raised" />
          <LoadingBar className="h-11 w-full rounded-xl" /><LoadingBar className="h-3 w-56" />
        </div>
        <LoadingBar className="mx-auto h-3 w-full" />
      </section>
      <section className="flex flex-col items-center justify-center gap-6 border-t border-border bg-surface-elevated/60 px-6 py-10 sm:px-10 lg:border-t-0 lg:border-l lg:px-9 lg:py-12">
        <LoadingBar className="h-[320px] w-full max-w-[410px] rounded-2xl bg-surface-raised" />
        <LoadingBar className="h-6 w-64" /><LoadingBar className="h-12 w-full max-w-[410px] rounded-lg" />
        <LoadingBar className="h-9 w-48" />
      </section>
    </div>
  </main>;
}
