import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogMedia,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
it.each(["Cancelar", "Excluir"])(
  "requires an explicit decision: %s",
  async (decision) => {
    const action = vi.fn();
    const { user } = renderUI(
      <AlertDialog>
        <AlertDialogTrigger>Remover</AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>!</AlertDialogMedia>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              A operação remove o registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={action}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByRole("button", { name: "Remover" }));
    expect(screen.getByRole("alertdialog")).toHaveAccessibleName(
      "Excluir registro?",
    );
    await user.click(screen.getByRole("button", { name: decision }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(action).toHaveBeenCalledTimes(decision === "Excluir" ? 1 : 0);
  },
);
