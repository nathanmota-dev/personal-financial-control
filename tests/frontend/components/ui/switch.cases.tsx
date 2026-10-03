import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { Switch } from "@/components/ui/switch";
it("supports switching, the compact size and disabled controls", async () => {
  const change = vi.fn();
  const { user, rerender } = renderUI(
    <Switch aria-label="Cartão" onCheckedChange={change} />,
  );
  await user.click(screen.getByRole("switch"));
  expect(screen.getByRole("switch")).toBeChecked();
  expect(change).toHaveBeenCalledWith(true);
  rerender(<Switch size="sm" disabled aria-label="Cartão" />);
  expect(screen.getByRole("switch")).toHaveAttribute("data-size", "sm");
  expect(screen.getByRole("switch")).toBeDisabled();
});
