"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReserveClassificationDialogProps } from "@/lib/interfaces/components/reserve-shortcuts";
import { cn } from "@/lib/utils";

export function ReserveClassificationDialog({ open, onOpenChange, icon, tone, title, description, listClassName, children }: ReserveClassificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-content-strong sm:max-w-xl">
        <DialogHeader icon={icon} tone={tone}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="leading-6 text-content">{description}</DialogDescription>
        </DialogHeader>
        <ul className={cn("max-h-[260px] divide-y divide-border overflow-y-auto", listClassName)}>{children}</ul>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
