import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { Textarea } from "@/components/ui/textarea";
it("edits multiline notes and respects disabled state", async () => {
  const change = vi.fn();
  const { user, rerender } = renderUI(
    <Textarea aria-label="Notas" onChange={change} />,
  );
  await user.type(screen.getByRole("textbox"), "Compra\nmensal");
  expect(screen.getByRole("textbox")).toHaveValue("Compra\nmensal");
  expect(change).toHaveBeenCalled();
  rerender(<Textarea aria-label="Notas" disabled />);
  expect(screen.getByRole("textbox")).toBeDisabled();
});
