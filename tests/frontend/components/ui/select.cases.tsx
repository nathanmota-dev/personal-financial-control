import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "@/components/ui/select";
it.each(["popper", "item-aligned"] as const)(
  "selects labelled options in a %s popup",
  async (position) => {
    const change = vi.fn();
    const { user } = renderUI(
      <Select onValueChange={change}>
        <SelectTrigger aria-label="Conta" size="sm">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent position={position}>
          <SelectGroup>
            <SelectLabel>Contas</SelectLabel>
            <SelectItem value="main">Principal</SelectItem>
            <SelectSeparator />
            <SelectItem value="reserve">Reserva</SelectItem>
            <SelectItem value="disabled" disabled>
              Arquivada
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );
    await user.click(screen.getByRole("combobox", { name: "Conta" }));
    expect(screen.getByRole("option", { name: "Arquivada" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await user.click(screen.getByRole("option", { name: "Reserva" }));
    expect(change).toHaveBeenCalledWith("reserve");
    expect(screen.getByRole("combobox")).toHaveTextContent("Reserva");
  },
);
