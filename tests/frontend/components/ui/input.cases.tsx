import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { Input } from "@/components/ui/input";
it("accepts edits and forwards disabled and invalid semantics", async () => {
  const onChange = vi.fn();
  const { user, rerender } = renderUI(
    <Input aria-label="Nome" onChange={onChange} />,
  );
  await user.type(screen.getByRole("textbox"), "Conta");
  expect(screen.getByRole("textbox")).toHaveValue("Conta");
  expect(onChange).toHaveBeenCalledTimes(5);
  rerender(<Input aria-label="Nome" disabled aria-invalid />);
  expect(screen.getByRole("textbox")).toBeDisabled();
  expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
});
