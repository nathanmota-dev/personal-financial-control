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
      <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Arquivar meta</DialogTitle>
          <DialogDescription className="text-slate-400">
            {goal?.name ?? "Meta"}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-6 text-slate-300">
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
