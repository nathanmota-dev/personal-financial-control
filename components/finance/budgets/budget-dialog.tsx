"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog,  DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { BudgetDialogProps } from "@/lib/interfaces/budgets";
import { BudgetForm } from "./budget-form";

export function BudgetDialog({ month, categories, limit, trigger }: BudgetDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button disabled={!limit && !categories.length} variant={limit ? "outline" : "default"} size={limit ? "icon-sm" : "default"} aria-label={limit ? `Editar limite de ${categories[0]?.name}` : "Novo limite"}>
        {limit ? <Pencil className="size-4" /> : <><Plus className="size-4" />Novo limite</>}
      </Button>}</DialogTrigger>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{limit ? `Editar limite de ${categories[0]?.name}` : "Novo limite"}</DialogTitle>
          <DialogDescription>Defina quanto pode gastar em {formatMonthLabel(month)}{limit ? ` na categoria ${categories[0]?.name}` : " por categoria"}. O limite vale apenas para esta competência.</DialogDescription>
        </DialogHeader>
        <BudgetForm month={month} categories={categories} limit={limit} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
