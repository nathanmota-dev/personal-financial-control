import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { SUMMARY_TONE_CLASSNAMES } from "../goals-constants";
import type { SummaryCardProps } from "../goals-types";

export function SummaryCard({ label, value, icon, tone }: SummaryCardProps) {
  return (
    <Card className="rounded-[1.5rem] border-slate-800 bg-slate-950/75">
      <CardContent className="space-y-3 pt-4">
        <div
          className={cn(
            "inline-flex rounded-full border p-2",
            SUMMARY_TONE_CLASSNAMES[tone]
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-slate-100">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
