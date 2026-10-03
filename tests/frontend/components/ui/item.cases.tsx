import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  ItemGroup,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemHeader,
  ItemFooter,
  ItemSeparator,
} from "@/components/ui/item";
it("composes list items and supports clickable items", () => {
  const { rerender } = renderUI(
    <ItemGroup>
      <Item>
        <ItemHeader>Conta</ItemHeader>
        <ItemMedia variant="icon">+</ItemMedia>
        <ItemContent>
          <ItemTitle>Principal</ItemTitle>
          <ItemDescription>Saldo disponível</ItemDescription>
        </ItemContent>
        <ItemActions>
          <button>Editar</button>
        </ItemActions>
        <ItemFooter>R$ 100,00</ItemFooter>
      </Item>
      <ItemSeparator />
    </ItemGroup>,
  );
  expect(screen.getByRole("list")).toHaveTextContent("Principal");
  expect(screen.getByRole("button")).toHaveAccessibleName("Editar");
  rerender(
    <Item asChild variant="outline" size="sm">
      <a href="/goals">
        <ItemMedia>Meta</ItemMedia>
      </a>
    </Item>,
  );
  expect(screen.getByRole("link")).toHaveAttribute("href", "/goals");
});
