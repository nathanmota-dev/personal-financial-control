import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { renderUI, freezeFinanceDate } from "../../helpers";
it.each([false, true])(
  "selects and clears a financial date (controlled %s)",
  async (controlled) => {
    freezeFinanceDate();
    const change = vi.fn();
    const { user, container, rerender } = renderUI(
      <DatePickerField
        name="date"
        value="2026-07-16"
        clearable
        required
        onDateChange={controlled ? change : undefined}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /16 de julho de 2026/ }),
    );
    await user.click(
      screen.getByRole("button", { name: /sexta-feira, 17 de julho de 2026/i }),
    );
    if (controlled) {
      expect(change).toHaveBeenCalledWith("2026-07-17");
      rerender(
        <DatePickerField
          name="date"
          value="2026-07-17"
          clearable
          onDateChange={change}
        />,
      );
    }
    expect(container.querySelector('input[name="date"]')).toHaveValue(
      "2026-07-17",
    );
    await user.click(screen.getByRole("button", { name: "Remover data" }));
    if (controlled) expect(change).toHaveBeenLastCalledWith(undefined);
    else
      expect(
        screen.getByRole("button", { name: "Selecione a data" }),
      ).toBeVisible();
  },
);
it("presents the placeholder when there is no date", async () => {
  freezeFinanceDate();
  const { user } = renderUI(
    <DatePickerField placeholder="Escolher vencimento" />,
  );
  await user.click(screen.getByRole("button", { name: "Escolher vencimento" }));
  expect(screen.getByRole("grid")).toBeVisible();
});
it("blocks dates outside the min and max range", async () => {
  freezeFinanceDate();
  const change = vi.fn();
  const { user } = renderUI(
    <DatePickerField
      value="2026-07-16"
      min="2026-07-10"
      max="2026-07-20"
      onDateChange={change}
    />,
  );
  await user.click(screen.getByRole("button", { name: /16 de julho de 2026/ }));
  expect(
    screen.getByRole("button", { name: "quinta-feira, 9 de julho de 2026" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "terça-feira, 21 de julho de 2026" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: /sexta-feira, 17 de julho de 2026/i }),
  ).toBeEnabled();
});
