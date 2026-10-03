import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupButton,
} from "@/components/ui/input-group";
it("focuses the input from the adornment without stealing button focus", async () => {
  const click = vi.fn();
  const { user, rerender } = renderUI(
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>R$</InputGroupText>
        <InputGroupButton onClick={click}>Limpar</InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput aria-label="Valor" />
    </InputGroup>,
  );
  await user.click(screen.getByText("R$"));
  expect(screen.getByRole("textbox")).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Limpar" }));
  expect(click).toHaveBeenCalledOnce();
  expect(screen.getByRole("button")).toHaveFocus();
  rerender(
    <InputGroup>
      <InputGroupTextarea aria-label="Notas" />
      <InputGroupAddon align="block-end">
        <InputGroupText>Detalhes</InputGroupText>
      </InputGroupAddon>
    </InputGroup>,
  );
  await user.type(screen.getByRole("textbox"), "Observação");
  expect(screen.getByRole("textbox")).toHaveValue("Observação");
});
