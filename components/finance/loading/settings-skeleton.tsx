import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows, LoadingTabs } from "./primitives";

export function SettingsSkeleton() {
  return <LoadingPage label="configurações" className="min-[100.0625rem]:space-y-5">
    <LoadingTabs count={7} />
    <LoadingPanel>
      <LoadingBar className="h-10 w-48" />
      <div className="flex items-center justify-between gap-4 border-t border-border pt-5"><LoadingBar className="h-3 w-40" /><LoadingBar className="h-10 w-32 rounded-[10px]" /></div>
      <LoadingRows count={4} columns={4} />
    </LoadingPanel>
  </LoadingPage>;
}
