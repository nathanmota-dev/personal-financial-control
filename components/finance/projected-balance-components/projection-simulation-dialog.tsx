"use client";

import { useId, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import type { ProjectionSimulationDialogProps } from "@/app/interfaces/projected-balance";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  centsToMoneyInput,
  formatDateLabel,
  moneyInputToCents,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-10 rounded-xl border-slate-700 bg-slate-950/80 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] placeholder:text-slate-600 focus-visible:border-cyan-400/70 focus-visible:ring-cyan-400/20";
const selectTriggerClassName =
  "h-10 w-full rounded-xl border-slate-700 bg-slate-950/80 pr-11 pl-4 text-left text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] hover:bg-slate-900/90 focus-visible:border-cyan-400/70 focus-visible:ring-cyan-400/20";
const selectContentClassName =
  "rounded-[1.25rem] border-slate-800 bg-slate-950/96 p-1 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)]";
const selectItemClassName =
  "min-h-10 rounded-[0.9rem] px-3 py-2 text-sm text-slate-200 focus:bg-slate-800 focus:text-slate-50 data-[state=checked]:bg-slate-800/90 data-[state=checked]:text-slate-50";
const fieldLabelClassName = "text-xs uppercase tracking-[0.16em] text-slate-400";

export function ProjectionSimulationDialog({
  accounts,
  filters,
  onAddSimulation,
}: ProjectionSimulationDialogProps) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState(filters.accountId ?? accounts[0]?.id ?? "");
  const [date, setDate] = useState(filters.startDate);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setAccountId(filters.accountId ?? accounts[0]?.id ?? "");
    setDate(filters.startDate);
    setDescription("");
    setAmount("");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      resetForm();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedAccount = accounts.find((account) => account.id === accountId);

    if (!selectedAccount) {
      setError("Selecione a conta que será afetada.");
      return;
    }

    if (!description.trim()) {
      setError("Informe uma descrição para a compra.");
      return;
    }

    let amountCents: number;

    try {
      amountCents = moneyInputToCents(amount);
    } catch {
      setError("Informe um valor monetário válido.");
      return;
    }

    if (amountCents <= 0) {
      setError("O valor da compra deve ser maior que zero.");
      return;
    }

    onAddSimulation({
      id: crypto.randomUUID(),
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      date,
      description: description.trim(),
      amountCents,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="shrink-0">
          <Plus className="size-4" aria-hidden="true" />
          Simular compra
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-800 bg-slate-950/95 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Simular compra</DialogTitle>
          <DialogDescription className="text-slate-400">
            A compra será aplicada apenas nesta projeção, entre {formatDateLabel(filters.startDate)} e{" "}
            {formatDateLabel(filters.endDate)}.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`${formId}-description`} className={fieldLabelClassName}>
                Descrição
              </Label>
              <Input
                id={`${formId}-description`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={fieldClassName}
                placeholder="Ex.: compra de um notebook"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-amount`} className={fieldLabelClassName}>
                Valor
              </Label>
              <Input
                id={`${formId}-amount`}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={cn(fieldClassName, "font-mono")}
                inputMode="decimal"
                placeholder={centsToMoneyInput(0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-date`} className={fieldLabelClassName}>
                Data da compra
              </Label>
              <Input
                id={`${formId}-date`}
                type="date"
                value={date}
                min={filters.startDate}
                max={filters.endDate}
                onChange={(event) => setDate(event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`${formId}-account`} className={fieldLabelClassName}>
                Conta afetada
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id={`${formId}-account`} className={selectTriggerClassName}>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent className={selectContentClassName}>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id} className={selectItemClassName}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Aplicar à projeção</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
