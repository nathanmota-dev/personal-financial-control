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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/finance-ui";

import type { AllocationDialogProps } from "../goals-types";
import { LabeledInput } from "./labeled-input";

export function AllocationDialog({
  state,
  form,
  setForm,
  freeReserveCents,
  isPending,
  onOpenChange,
  onSubmit,
}: AllocationDialogProps) {
  const isRelease = state?.type === "manual_release";

  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface text-content-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isRelease ? "Liberar saldo" : "Alocar saldo"}</DialogTitle>
          <DialogDescription className="text-content">
            {state?.goal.name ?? "Meta"}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <LabeledInput
            id="goal-allocation-amount"
            label="Valor"
            value={form.amount}
            placeholder="0,00"
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: event.target.value }))
            }
          />
          <LabeledInput
            id="goal-allocation-date"
            label="Data"
            type="date"
            value={form.occurredOn}
            onChange={(event) =>
              setForm((current) => ({ ...current, occurredOn: event.target.value }))
            }
          />
          <div className="rounded-2xl border border-border bg-surface-raised/50 px-4 py-3 text-sm text-content">
            {isRelease
              ? `Alocado nesta meta: ${formatCurrency(state?.goal.allocatedCents ?? 0)}`
              : `Reserva livre: ${formatCurrency(freeReserveCents)}`}
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-allocation-notes" className="text-content-strong">
              Notas
            </Label>
            <Textarea
              id="goal-allocation-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              className="min-h-20 border-input bg-surface/70 text-content-strong"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.amount || !form.occurredOn}
            >
              {isPending ? "Salvando..." : isRelease ? "Liberar" : "Alocar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
