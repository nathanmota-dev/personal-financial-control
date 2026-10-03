import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
it.each(["left", "right", "top", "bottom"] as const)(
  "opens a %s sheet and closes via its control",
  async (side) => {
    const { user } = renderUI(
      <Sheet>
        <SheetTrigger>Detalhes</SheetTrigger>
        <SheetContent side={side} showCloseButton={side !== "left"}>
          <SheetHeader>
            <SheetTitle>Registro</SheetTitle>
            <SheetDescription>Dados financeiros</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Voltar</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    await user.click(screen.getByRole("button", { name: "Detalhes" }));
    expect(screen.getByRole("dialog", { name: "Registro" })).toHaveAttribute(
      "data-side",
      side,
    );
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  },
);
