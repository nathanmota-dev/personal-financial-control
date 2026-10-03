import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  ButtonGroup,
  ButtonGroupText,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
it("groups related actions and supports vertical composition", () => {
  const { rerender } = renderUI(
    <ButtonGroup>
      <ButtonGroupText>Período</ButtonGroupText>
      <button>Anterior</button>
      <ButtonGroupSeparator />
      <button>Próximo</button>
    </ButtonGroup>,
  );
  expect(screen.getByRole("group")).toHaveTextContent("PeríodoAnteriorPróximo");
  rerender(
    <ButtonGroup orientation="vertical">
      <ButtonGroupText asChild>
        <a href="/dashboard">Visão</a>
      </ButtonGroupText>
      <ButtonGroupSeparator orientation="horizontal" />
    </ButtonGroup>,
  );
  expect(screen.getByRole("group")).toHaveAttribute(
    "data-orientation",
    "vertical",
  );
  expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard");
});
