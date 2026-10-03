import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { Checkbox } from "@/components/ui/checkbox";
it("reports changes and toggles through keyboard and pointer", async () => {
  const onCheckedChange = vi.fn();
  const { user } = renderUI(
    <Checkbox aria-label="Selecionar" onCheckedChange={onCheckedChange} />,
  );
  const control = screen.getByRole("checkbox");
  await user.click(control);
  expect(control).toBeChecked();
  expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  await user.keyboard(" ");
  expect(control).not.toBeChecked();
  expect(onCheckedChange).toHaveBeenLastCalledWith(false);
});
