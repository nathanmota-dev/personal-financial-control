import { Card,CardContent,CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="dashboard-page space-y-6 min-[100.0625rem]:space-y-5" role="status" aria-label="Carregando painel financeiro" aria-busy="true">
      <header className="flex min-h-[104px] flex-wrap items-start justify-between gap-4 pt-[17px] min-[100.0625rem]:min-h-[76px] min-[100.0625rem]:pt-0">
          <div className="w-full max-w-xl space-y-2">
            <div className="h-11 w-56 animate-pulse rounded-full bg-surface-elevated" />
            <div className="h-4 w-full animate-pulse rounded-full bg-surface-raised" />
          </div>
          <div className="flex gap-3 pt-[5px]">
            <div className="h-9 w-36 animate-pulse rounded-lg bg-surface-elevated" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-surface-elevated" />
          </div>
      </header>

      <div className="grid gap-[14px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="h-[154px] gap-0 rounded-[20px] border-border bg-card pt-[19px] pb-[28px] min-[100.0625rem]:h-[138px] min-[100.0625rem]:pb-5 min-[100.0625rem]:pt-4">
            <CardContent className="space-y-3 px-[18px]">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded-full bg-surface-elevated" />
                <div className="size-4 animate-pulse rounded-full bg-brand/15" />
              </div>
              <div className="h-9 w-32 animate-pulse rounded-full bg-surface-elevated/90" />
              <div className="h-3 w-full animate-pulse rounded-full bg-surface-raised" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,658fr)_minmax(0,436fr)]">
        <Card className="min-w-0 rounded-[20px] border-border bg-card xl:h-[704px] min-[100.0625rem]:h-[600px] min-[100.0625rem]:py-5">
          <CardHeader className="space-y-3">
            <div className="h-6 w-48 animate-pulse rounded-full bg-surface-elevated" />
            <div className="h-4 w-full max-w-64 animate-pulse rounded-full bg-surface-raised" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-surface-raised" />
            <div className="h-[320px] animate-pulse rounded-xl bg-surface-elevated min-[100.0625rem]:h-[280px]" />
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-surface-elevated" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-raised" />
            <div className="grid grid-cols-2 gap-6 border-t border-border pt-4">
              <div className="h-12 animate-pulse rounded-lg bg-surface-elevated" />
              <div className="h-12 animate-pulse rounded-lg bg-surface-elevated" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 min-[100.0625rem]:gap-5">
          <Card className="min-w-0 gap-5 rounded-[20px] border-border bg-card xl:h-[340px] min-[100.0625rem]:h-[290px]">
            <CardHeader className="space-y-3">
              <div className="h-6 w-40 animate-pulse rounded-full bg-surface-elevated" />
              <div className="h-4 w-32 animate-pulse rounded-full bg-surface-raised" />
            </CardHeader>
            <CardContent className="space-y-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="h-4 w-20 shrink-0 animate-pulse rounded-full bg-surface-elevated" />
                  <div className="h-2 flex-1 animate-pulse rounded-full bg-brand/20" />
                  <div className="h-4 w-16 shrink-0 animate-pulse rounded-full bg-surface-raised" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="min-w-0 gap-5 rounded-[20px] border-border bg-card xl:h-[340px] min-[100.0625rem]:h-[290px]">
            <CardHeader className="space-y-3">
              <div className="h-6 w-44 animate-pulse rounded-full bg-surface-elevated" />
              <div className="h-4 w-36 animate-pulse rounded-full bg-surface-raised" />
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-5 sm:flex-nowrap">
              <div className="size-[200px] shrink-0 animate-pulse rounded-full border-[32px] border-surface-elevated min-[100.0625rem]:size-[180px]" />
              <div className="min-w-0 flex-1 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-4 animate-pulse rounded-full bg-surface-raised" />
              ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
