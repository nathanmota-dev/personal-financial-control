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
  "h-10 rounded-xl border-input bg-surface/80 text-sm text-content-strong shadow-[inset_0_1px_0_rgb(var(--content-rgb) / .08)] placeholder:text-content-subtle focus-visible:border-brand/70 focus-visible:ring-brand/20";
const selectTriggerClassName =
  "h-10 w-full rounded-xl border-input bg-surface/80 pr-11 pl-4 text-left text-sm text-content-strong shadow-[inset_0_1px_0_rgb(var(--content-rgb) / .08)] hover:bg-surface-raised/90 focus-visible:border-brand/70 focus-visible:ring-brand/20";
const selectContentClassName =
  "rounded-[1.25rem] border-border bg-surface/96 p-1 text-content-strong shadow-[0_24px_80px_rgb(var(--surface-rgb) / .45)]";
const selectItemClassName =
  "min-h-10 rounded-[0.9rem] px-3 py-2 text-sm text-content-strong focus:bg-surface-elevated focus:text-content-strong data-[state=checked]:bg-surface-elevated/90 data-[state=checked]:text-content-strong";
const fieldLabelClassName = "text-xs uppercase tracking-[0.16em] text-content";

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
      <DialogContent className="border-border bg-surface/95 text-content-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Simular compra</DialogTitle>
          <DialogDescription className="text-content">
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
            <p className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
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
