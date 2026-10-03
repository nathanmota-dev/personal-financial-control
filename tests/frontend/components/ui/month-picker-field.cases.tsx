import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import { renderUI, freezeFinanceDate } from "../../helpers";
it.each([false, true])(
  "selects and clears a month (controlled %s)",
  async (controlled) => {
    freezeFinanceDate();
    const change = vi.fn();
    const { user, container, rerender } = renderUI(
      <MonthPickerField
        name="month"
        value="2026-07"
        clearable
        required
        onMonthChange={controlled ? change : undefined}
      />,
    );
    await user.click(screen.getByRole("button", { name: "julho de 2026" }));
    await user.click(screen.getByRole("button", { name: "Ago" }));
    if (controlled) {
      expect(change).toHaveBeenCalledWith("2026-08");
      rerender(
        <MonthPickerField
          name="month"
          value="2026-08"
          clearable
          onMonthChange={change}
        />,
      );
    }
    expect(container.querySelector('input[name="month"]')).toHaveValue(
      "2026-08",
    );
    await user.click(screen.getByRole("button", { name: "Remover mês" }));
    if (controlled) expect(change).toHaveBeenLastCalledWith(undefined);
    else
      expect(
        screen.getByRole("button", { name: "Selecione o mês" }),
      ).toBeVisible();
  },
);
it("uses a placeholder for an empty value and opens the current year", async () => {
  freezeFinanceDate();
  const { user } = renderUI(
    <MonthPickerField placeholder="Escolher competência" />,
  );
  await user.click(
    screen.getByRole("button", { name: "Escolher competência" }),
  );
  expect(screen.getByText("2026")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Jul" }));
  expect(screen.getByRole("button", { name: "julho de 2026" })).toBeVisible();
});
