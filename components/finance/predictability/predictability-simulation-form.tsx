"use client";

import { useState } from "react";

import type { PredictabilitySimulationFormProps } from "@/app/interfaces/predictability";
import { FinanceField } from "@/components/finance/finance-field";
import { MoneyInput } from "@/components/finance/money-input";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Input } from "@/components/ui/input";
import { centsToMoneyInput, moneyInputToCents } from "@/lib/finance-ui";
import { resolveSimulationMinDate } from "@/lib/predictability-simulation";

const defaultDescription = "Compra simulada";

function parseAmount(value: string) {
  try {
    return moneyInputToCents(value);
  } catch {
    return 0;
  }
}

export function PredictabilitySimulationForm({ predictability, purchase, onSimulate }: PredictabilitySimulationFormProps) {
  const minDate = resolveSimulationMinDate(predictability);
  const [amount, setAmount] = useState(purchase ? centsToMoneyInput(purchase.amountCents) : "");
  const [date, setDate] = useState<string | undefined>(purchase?.date ?? minDate);
  const [description, setDescription] = useState(purchase?.description ?? "");
  const [message, setMessage] = useState("");

  function submit() {
    const amountCents = parseAmount(amount);

    if (amountCents <= 0 || !date) {
      setMessage("Informe um valor maior que zero e a data da compra.");
      return;
    }

    onSimulate({ date, amountCents, description: description.trim() || defaultDescription });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-5"
    >
      <FinanceField label="Valor da compra (R$)">
        <MoneyInput aria-label="Valor da compra (R$)" value={amount} onValueChange={setAmount} placeholder="0,00" autoFocus />
      </FinanceField>
      <FinanceField label="Data da compra">
        <DatePickerField value={date} onDateChange={setDate} min={minDate} max={predictability.cycle.end} required />
      </FinanceField>
      <FinanceField label="Descrição (opcional)">
        <Input value={description} onChange={(event) => setDescription(event.currentTarget.value)} placeholder={defaultDescription} maxLength={80} />
      </FinanceField>
      <p role="status" className="text-sm text-danger">{message}</p>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit">Simular</Button>
      </div>
    </form>
  );
}
