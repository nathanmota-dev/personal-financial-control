import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
it.each([true, false])(
  "opens an accessible dialog and supports closing (icon: %s)",
  async (icon) => {
    const change = vi.fn();
    const { user } = renderUI(
      <Dialog onOpenChange={change}>
        <DialogTrigger>Abrir formulário</DialogTrigger>
        <DialogContent showCloseButton={icon}>
          <DialogHeader>
            <DialogTitle>Formulário</DialogTitle>
            <DialogDescription>Preencha seus dados</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={!icon}>
            <DialogClose>Cancelar</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Abrir formulário" }));
    expect(
      screen.getByRole("dialog", { name: "Formulário" }),
    ).toHaveAccessibleDescription("Preencha seus dados");
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(change).toHaveBeenLastCalledWith(false);
  },
);
