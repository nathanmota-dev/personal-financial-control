import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur">
        <CardHeader className="gap-4">
          <div className="h-3 w-24 animate-pulse rounded-full bg-sky-400/30" />
          <div className="space-y-3">
            <div className="h-10 w-full max-w-md animate-pulse rounded-full bg-slate-800" />
            <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-900" />
            <div className="h-4 w-3/4 max-w-xl animate-pulse rounded-full bg-slate-900/90" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="rounded-[1.5rem] border-slate-800 bg-slate-950/75">
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-800" />
                <div className="size-9 animate-pulse rounded-2xl bg-cyan-400/15" />
              </div>
              <div className="h-9 w-32 animate-pulse rounded-full bg-slate-700/90" />
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-900" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader className="space-y-3">
            <div className="h-6 w-48 animate-pulse rounded-full bg-slate-800" />
            <div className="h-4 w-64 animate-pulse rounded-full bg-slate-900" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-72 animate-pulse rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(8,47,73,0.55)_0%,rgba(15,23,42,0.92)_100%)]" />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader className="space-y-3">
              <div className="h-6 w-40 animate-pulse rounded-full bg-slate-800" />
              <div className="h-4 w-32 animate-pulse rounded-full bg-slate-900" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 px-4 py-3"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-28 animate-pulse rounded-full bg-slate-800" />
                    <div className="h-3 w-20 animate-pulse rounded-full bg-slate-900" />
                  </div>
                  <div className="h-5 w-20 animate-pulse rounded-full bg-cyan-400/20" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader className="space-y-3">
              <div className="h-6 w-44 animate-pulse rounded-full bg-slate-800" />
              <div className="h-4 w-36 animate-pulse rounded-full bg-slate-900" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-4 animate-pulse rounded-full bg-slate-900" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
