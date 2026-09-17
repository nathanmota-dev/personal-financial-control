"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { ArchiveDialogProps } from "../goals-types";

export function ArchiveDialog({
  goal,
  isPending,
  onOpenChange,
  onSubmit,
}: ArchiveDialogProps) {
  return (
    <Dialog open={Boolean(goal)} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface text-content-strong sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Arquivar meta</DialogTitle>
          <DialogDescription className="text-content">
            {goal?.name ?? "Meta"}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-6 text-content">
          A meta sai dos cards e gráficos principais. O histórico permanece
          preservado para consulta.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onSubmit}
          >
            {isPending ? "Arquivando..." : "Arquivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
