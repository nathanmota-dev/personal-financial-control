import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
it("opens and closes a drawer while notifying the owner", async () => {
  const change = vi.fn();
  const { user } = renderUI(
    <Drawer onOpenChange={change}>
      <DrawerTrigger>Menu</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Navegação</DrawerTitle>
          <DrawerDescription>Escolha uma página</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose>Voltar</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>,
  );
  await user.click(screen.getByRole("button", { name: "Menu" }));
  expect(screen.getByRole("dialog", { name: "Navegação" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Voltar" }));
  expect(change).toHaveBeenLastCalledWith(false);
});
