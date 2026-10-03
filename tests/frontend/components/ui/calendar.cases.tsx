import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { renderUI } from "../../helpers";
it("selects days and exposes localized month and year choices", async () => {
  const select = vi.fn();
  const { user } = renderUI(
    <Calendar
      mode="single"
      defaultMonth={new Date(2026, 6, 1)}
      captionLayout="dropdown"
      locale={ptBR}
      onSelect={select}
      showWeekNumber
    />,
  );
  await user.click(
    screen.getByRole("button", { name: /sexta-feira, 17 de julho de 2026/i }),
  );
  expect(select).toHaveBeenCalledWith(
    new Date(2026, 6, 17),
    expect.anything(),
    expect.anything(),
    expect.anything(),
  );
  expect(screen.getAllByRole("combobox")).toHaveLength(2);
  await user.selectOptions(screen.getAllByRole("combobox")[0], "7");
  expect(screen.getByRole("grid")).toHaveAccessibleName(/agosto 2026/i);
});
it("marks the complete selected range", () => {
  const { container } = renderUI(
    <Calendar
      mode="range"
      defaultMonth={new Date(2026, 6, 1)}
      selected={{ from: new Date(2026, 6, 16), to: new Date(2026, 6, 18) }}
    />,
  );
  expect(
    container.querySelector('[data-range-start="true"]'),
  ).toBeInTheDocument();
  expect(
    container.querySelector('[data-range-end="true"]'),
  ).toBeInTheDocument();
  expect(
    container.querySelector('[data-range-middle="true"]'),
  ).toBeInTheDocument();
});
