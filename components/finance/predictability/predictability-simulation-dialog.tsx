"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";

import type { PredictabilitySimulationDialogProps } from "@/app/interfaces/predictability";
import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { PredictabilitySimulationForm } from "./predictability-simulation-form";

export function PredictabilitySimulationDialog({ predictability, purchase, onSimulate }: PredictabilitySimulationDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium">
          <ShoppingBag className="size-[17px]" aria-hidden="true" />
          {purchase ? "Editar simulação" : "Simular compra"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader icon={<ShoppingBag />} tone="brand">
          <DialogTitle>Simular compra</DialogTitle>
          <DialogDescription>
            Veja quantos dias do ciclo uma compra consumiria antes de fazê-la. Nada é salvo: a simulação some ao sair da página.
          </DialogDescription>
        </DialogHeader>
        <PredictabilitySimulationForm
          predictability={predictability}
          purchase={purchase}
          onSimulate={(next) => {
            onSimulate(next);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
