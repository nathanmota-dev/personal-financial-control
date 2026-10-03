import { screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
it("selects with keyboard and reports the new value", async () => {
  const change = vi.fn();
  const { user } = renderUI(
    <RadioGroup
      orientation="horizontal"
      defaultValue="one"
      onValueChange={change}
    >
      <RadioGroupItem value="one" aria-label="Principal" />
      <RadioGroupItem value="two" aria-label="Reserva" />
    </RadioGroup>,
  );
  expect(screen.getByRole("radio", { name: "Principal" })).toBeChecked();
  await user.click(screen.getByRole("radio", { name: "Reserva" }));
  expect(change).toHaveBeenCalledWith("two");
  screen.getByRole("radio", { name: "Principal" }).focus();
  await user.keyboard(" ");
  await waitFor(() =>
    expect(screen.getByRole("radio", { name: "Principal" })).toBeChecked(),
  );
});
