"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DetailSheetProps } from "@/lib/interfaces/day-detail";

/** Side sheet used to inspect one day; it stays closed while `header` is null. */
export function DetailSheet({ header, onOpenChange, children }: DetailSheetProps) {
  return (
    <Sheet open={Boolean(header)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-border bg-surface text-content-strong sm:max-w-xl">
        {header ? (
          <>
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-xl text-content-strong">{header.title}</SheetTitle>
                {header.addon}
              </div>
              <SheetDescription className="text-content">{header.description}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-6 pb-6">{children}</div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
