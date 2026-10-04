"use client";

import { Button } from "@/components/ui/button";
import {
DialogFooter
} from "@/components/ui/dialog";
import type { AllocationDialogDialogFooter3Props } from "@/lib/interfaces/render/allocation-dialog-allocation-dialog-dialog-footer3";

export function AllocationDialogDialogFooter3({ isExisting, isPending, onDelete, onOpenChange, holdings, purposes }: AllocationDialogDialogFooter3Props) {
  return (
<DialogFooter className="sm:justify-between">
            <div>
              {isExisting ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  onClick={onDelete}
                >
                  Remover alocação
                </Button>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !holdings.length || !purposes.length}>
                {isPending ? "Salvando..." : "Salvar alocação"}
              </Button>
            </div>
          </DialogFooter>
  );
}
