"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteRecurringTemplateAction,
  pauseRecurringTemplateAction,
  updateRecurringTemplateAction,
} from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  RecurringActionButtonProps,
  RecurringDeleteDialogProps,
  RecurringDeleteMode,
} from "@/lib/interfaces/recurring";

export function PauseRecurringButton({ id }: RecurringActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function pause() {
    startTransition(async () => {
      const result = await pauseRecurringTemplateAction(id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Recorrência pausada.");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" disabled={isPending} onClick={pause}>
      <Pause className="size-4" />
      {isPending ? "Pausando..." : "Pausar"}
    </Button>
  );
}

export function ResumeRecurringButton({ id }: RecurringActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function resume() {
    startTransition(async () => {
      const result = await updateRecurringTemplateAction({ id, status: "active" });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Recorrência retomada.");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" disabled={isPending} onClick={resume}>
      <Play className="size-4" />
      {isPending ? "Retomando..." : "Retomar"}
    </Button>
  );
}

export function RecurringDeleteDialog({ id }: RecurringDeleteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function deleteWithMode(mode: RecurringDeleteMode) {
    startTransition(async () => {
      const result = await deleteRecurringTemplateAction(id, mode);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        mode === "keep_history"
          ? "Recorrência excluída; histórico mantido."
          : "Recorrência e histórico excluídos."
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={isPending}>
          <Trash2 className="size-4" />
          Excluir
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-800 bg-slate-950/95 sm:max-w-lg">
        <DialogHeader>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-rose-300">Ação definitiva</p>
          <DialogTitle className="text-2xl text-slate-50">Excluir recorrência?</DialogTitle>
          <DialogDescription>
            Escolha o que fazer com os lançamentos que foram gerados por esta regra. Lançamentos manuais nunca entram nesta exclusão.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            className="h-auto items-start justify-between gap-4 rounded-2xl border-slate-700 bg-slate-900/55 px-4 py-4 text-left whitespace-normal hover:border-cyan-400/40 hover:bg-cyan-400/[0.06]"
            onClick={() => deleteWithMode("keep_history")}
          >
            <span>
              <span className="block font-semibold text-slate-100">Manter histórico</span>
              <span className="mt-1 block text-xs font-normal leading-5 text-slate-400">
                Remove somente a regra e preserva os lançamentos já gerados.
              </span>
            </span>
            <span className="shrink-0 text-xs font-medium text-cyan-300">Recomendado</span>
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            className="h-auto items-start justify-between gap-4 rounded-2xl px-4 py-4 text-left whitespace-normal"
            onClick={() => deleteWithMode("delete_history")}
          >
            <span>
              <span className="block font-semibold">Excluir histórico</span>
              <span className="mt-1 block text-xs font-normal leading-5 text-rose-100/80">
                Remove a regra e todos os lançamentos vinculados a ela.
              </span>
            </span>
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
