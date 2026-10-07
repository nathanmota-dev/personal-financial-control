"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";

import { Plus } from "lucide-react";
import { useId,useState,type FormEvent } from "react";
import { ProjectionSimulationDialogForm1 } from "./projection-simulation-dialog-projection-simulation-dialog-form1";

import type { ProjectionSimulationDialogProps } from "@/app/interfaces/projected-balance";
import { Button } from "@/components/ui/button";
import {
Dialog,

DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger
} from "@/components/ui/dialog";
import {
formatDateLabel,
moneyInputToCents
} from "@/lib/finance-ui";

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
      <DialogContent className="border-border bg-card text-content-strong sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Simular compra</DialogTitle>
          <DialogDescription className="text-content">
            A compra será aplicada apenas nesta projeção, entre {formatDateLabel(filters.startDate)} e{" "}
            {formatDateLabel(filters.endDate)}.
          </DialogDescription>
        </DialogHeader>

        <ProjectionSimulationDialogForm1 handleSubmit={handleSubmit} formId={formId} description={description} setDescription={setDescription} amount={amount} setAmount={setAmount} date={date} filters={filters} setDate={setDate} accountId={accountId} setAccountId={setAccountId} accounts={accounts} error={error} setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}
