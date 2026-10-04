import { LoadingBar, LoadingFields, LoadingPage, LoadingPanel, LoadingTabs } from "./primitives";

export function RecurringSkeleton() {
  return <LoadingPage label="recorrências" actions={2}>
    <LoadingTabs count={3} />
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <LoadingPanel key={index}>
        <LoadingBar className="h-9 w-36" />
        <LoadingFields count={4} />
        <div className="flex gap-2 border-t border-border pt-4"><LoadingBar className="h-9 w-24" /><LoadingBar className="h-9 w-24" /></div>
      </LoadingPanel>)}
    </div>
  </LoadingPage>;
}
