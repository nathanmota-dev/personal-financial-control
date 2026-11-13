import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { YearPickerField } from "@/components/ui/year-picker-field";
import { renderUI, freezeFinanceDate } from "../../helpers";

it("lists years from the current year forward and selects one", async () => {
  freezeFinanceDate();
  const change = vi.fn();
  const { user } = renderUI(<YearPickerField value="2026" onYearChange={change} />);
  await user.click(screen.getByRole("button", { name: "Selecionar ano: 2026" }));
  expect(screen.getByText("Escolha o ano")).toBeVisible();
  expect(screen.getByRole("button", { name: "2026" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("button", { name: "2025" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Anos anteriores" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "2030" }));
  expect(change).toHaveBeenCalledWith("2030");
});

it("pages through year ranges within the min and max limits", async () => {
  freezeFinanceDate();
  const change = vi.fn();
  const { user } = renderUI(
    <YearPickerField value="2040" minYear={2026} maxYear={2045} onYearChange={change} />,
  );
  await user.click(screen.getByRole("button", { name: "Selecionar ano: 2040" }));
  expect(screen.getByRole("button", { name: "2040" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "2046" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Próximos anos" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Anos anteriores" }));
  expect(screen.getByRole("button", { name: "2026" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Próximos anos" }));
  expect(screen.getByRole("button", { name: "2038" })).toBeVisible();
});

it("shows the placeholder when no year is selected", async () => {
  freezeFinanceDate();
  const { user } = renderUI(<YearPickerField placeholder="Escolher ano" onYearChange={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Escolher ano" }));
  expect(screen.getByRole("button", { name: "2026" })).toHaveAttribute("aria-pressed", "false");
});
