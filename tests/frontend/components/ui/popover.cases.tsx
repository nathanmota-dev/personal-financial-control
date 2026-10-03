import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  Popover,
  PopoverAnchor,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";
it("presents anchored contextual information and closes with Escape", async () => {
  const { user } = renderUI(
    <Popover>
      <PopoverAnchor>
        <span>Saldo</span>
      </PopoverAnchor>
      <PopoverTrigger>Informações</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Saldo disponível</PopoverTitle>
          <PopoverDescription>Inclui receitas confirmadas</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>,
  );
  await user.click(screen.getByRole("button", { name: "Informações" }));
  expect(screen.getByText("Inclui receitas confirmadas")).toBeVisible();
  await user.keyboard("{Escape}");
  expect(screen.queryByText("Inclui receitas confirmadas")).toBeNull();
});
