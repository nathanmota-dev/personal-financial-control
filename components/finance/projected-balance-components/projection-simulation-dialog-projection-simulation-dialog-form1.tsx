"use client";

import { MoneyInput } from "@/components/finance/money-input";
import { Button } from "@/components/ui/button";
import {
DialogFooter
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
centsToMoneyInput
} from "@/lib/finance-ui";
import type { ProjectionSimulationDialogForm1Props } from "@/lib/interfaces/render/projection-simulation-dialog-projection-simulation-dialog-form1";
import { cn } from "@/lib/utils";
import { fieldClassName,fieldLabelClassName,selectContentClassName,selectItemClassName,selectTriggerClassName } from "@/lib/utils/components/projection-simulation-dialog";

export function ProjectionSimulationDialogForm1({ handleSubmit, formId, description, setDescription, amount, setAmount, date, filters, setDate, accountId, setAccountId, accounts, error, setOpen }: ProjectionSimulationDialogForm1Props) {
  return (
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
              <MoneyInput
                id={`${formId}-amount`}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className={cn(fieldClassName, "tabular-nums")}
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
  );
}
