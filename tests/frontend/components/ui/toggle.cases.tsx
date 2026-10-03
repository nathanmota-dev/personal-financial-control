import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { Toggle } from "@/components/ui/toggle";
it("toggles a formatting preference and reports its state", async () => {
  const change = vi.fn();
  const { user } = renderUI(
    <Toggle variant="outline" size="sm" onPressedChange={change}>
      Compactar
    </Toggle>,
  );
  await user.click(screen.getByRole("button"));
  expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button"));
  expect(change).toHaveBeenLastCalledWith(false);
});
