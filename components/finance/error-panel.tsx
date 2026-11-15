import { TriangleAlert } from "lucide-react";

import type { ErrorPanelProps } from "@/lib/interfaces/finance-presentation";

export function ErrorPanel({ title, message }: ErrorPanelProps) {
  return (
    <section role="alert" aria-label={title} className="flex min-w-0 items-start gap-3.5 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <span aria-hidden className="tone-soft tone-danger inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
        <TriangleAlert className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-content-strong">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-content">{message}</p>
      </div>
    </section>
  );
}
