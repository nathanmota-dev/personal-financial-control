"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { HoldingDialogForm1 } from "./holding-dialog-holding-dialog-form1";

import {
Dialog,

DialogDescription,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog";
import type { HoldingDialogProps } from "@/lib/interfaces/investment-portfolio";

export function HoldingDialog({
  state,
  form,
  setForm,
  assetClasses,
  instrumentTypes,
  isPending,
  onOpenChange,
  onSubmit,
}: HoldingDialogProps) {
  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] overflow-y-auto border-border bg-card text-content-strong sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{state?.mode === "edit" ? "Editar ativo" : "Cadastrar ativo"}</DialogTitle>
          <DialogDescription className="leading-6 text-content">
            Registre o valor atual informado pela instituição. Esse cadastro organiza o patrimônio
            e não cria lançamento financeiro.
          </DialogDescription>
        </DialogHeader>

        <HoldingDialogForm1 onSubmit={onSubmit} form={form} setForm={setForm} assetClasses={assetClasses} instrumentTypes={instrumentTypes} onOpenChange={onOpenChange} isPending={isPending} state={state} />
      </DialogContent>
    </Dialog>
  );
}
