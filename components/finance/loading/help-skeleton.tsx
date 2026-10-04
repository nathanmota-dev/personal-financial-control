import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows } from "./primitives";
import { helpGuides, helpQuestions } from "@/lib/help-content";

export function HelpSkeleton() {
  return <LoadingPage label="ajuda" className="space-y-8 pb-4">
    <LoadingPanel><div className="grid gap-6 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => <div key={index} className="space-y-4"><LoadingBar className="size-8" /><LoadingBar className="h-5 w-40" /><LoadingBar className="h-20 w-full rounded-lg" /><LoadingBar className="w-28" /></div>)}
    </div></LoadingPanel>
    <div className="space-y-5"><LoadingBar className="h-6 w-48" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {helpGuides.map(guide => <LoadingPanel key={guide.href}><LoadingBar className="h-16 w-full rounded-lg" /></LoadingPanel>)}
      </div>
    </div>
    <LoadingPanel><LoadingRows count={helpQuestions.length} columns={2} /></LoadingPanel>
  </LoadingPage>;
}
