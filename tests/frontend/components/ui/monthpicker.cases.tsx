import { screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { MonthPicker } from "@/components/ui/monthpicker";
import { renderUI, freezeFinanceDate } from "../../helpers";
it("selects a month and navigates years with callbacks", async () => {
  freezeFinanceDate();
  const select = vi.fn(),
    forward = vi.fn(),
    back = vi.fn();
  const { user } = renderUI(
    <MonthPicker
      selectedMonth={new Date(2026, 6, 1)}
      onMonthSelect={select}
      onYearForward={forward}
      onYearBackward={back}
      callbacks={{
        yearLabel: (year) => `Ano ${year}`,
        monthLabel: (month) => `Mês ${month.number + 1}`,
      }}
      variant={{
        calendar: { main: "ghost", selected: "secondary" },
        chevrons: "ghost",
      }}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Mês 8" }));
  expect(select).toHaveBeenCalledWith(new Date(2026, 7, 1));
  const arrows = screen
    .getAllByRole("button")
    .filter((button) => !button.textContent);
  await user.click(arrows[1]);
  expect(forward).toHaveBeenCalledOnce();
  expect(screen.getByText("Ano 2027")).toBeVisible();
  await user.click(arrows[0]);
  expect(back).toHaveBeenCalledOnce();
});
it("disables out-of-range months and explicitly unavailable dates", async () => {
  const { user } = renderUI(
    <MonthPicker
      selectedMonth={new Date(2026, 6, 1)}
      minDate={new Date(2026, 4, 1)}
      maxDate={new Date(2026, 9, 1)}
      disabledDates={[new Date(2026, 6, 10)]}
    />,
  );
  expect(screen.getByRole("button", { name: "Jan" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Jul" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Dec" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Aug" })).toBeEnabled();
  await user.click(screen.getAllByRole("button")[1]);
  expect(
    within(screen.getByRole("table"))
      .getAllByRole("button")
      .every((button) => button.hasAttribute("disabled")),
  ).toBe(true);
});
it("normalizes a reversed range and permits uncontrolled month selection", async () => {
  freezeFinanceDate();
  const { user, rerender } = renderUI(
    <MonthPicker
      minDate={new Date(2026, 9, 1)}
      maxDate={new Date(2026, 4, 1)}
    />,
  );
  expect(screen.getByRole("button", { name: "Apr" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "May" })).toBeEnabled();
  rerender(<MonthPicker />);
  await user.click(screen.getByRole("button", { name: "Aug" }));
  expect(screen.getByRole("button", { name: "Aug" })).toHaveClass("bg-primary");
});
