import { LoadingFields, LoadingPage, LoadingPanel, LoadingTabs } from "./primitives";

export function SettingsSkeleton() {
  return <LoadingPage label="configurações">
    <LoadingTabs count={2} />
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => <LoadingPanel key={index}><LoadingFields count={4} /></LoadingPanel>)}
    </div>
  </LoadingPage>;
}
