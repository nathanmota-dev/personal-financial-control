import { screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import * as actions from "@/app/actions/finance";
import { ReserveContributionForm } from "@/components/finance/reserve-contribution-form";
import { renderUI } from "../../helpers";
import { navigation } from "../../setup";

it("starts from the reserve category's recurring entries and saves a typed monthly amount", async () => {
  const { user } = renderUI(<ReserveContributionForm contribution={{ source: "recurring", monthlyCents: 120_000, recurringMonthlyCents: 120_000, hasReserveCategory: true }} />);
  const input = screen.getByLabelText("Aporte mensal na reserva");
  expect(input).toHaveValue("1.200,00");
  expect(screen.getByText("Pelas recorrências da categoria Reserva de emergência.")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Usar recorrências" })).toBeNull();
  await user.clear(input);
  await user.type(input, "50000");
  expect(input).toHaveValue("500,00");
  await user.click(screen.getByRole("button", { name: "Salvar aporte" }));
  await waitFor(() => expect(actions.setReserveMonthlyContributionAction).toHaveBeenCalledWith({ monthlyContributionCents: 50_000 }));
  expect(navigation.refresh).toHaveBeenCalled();
});

it("goes back to the recurring entries and keeps the field when saving fails", async () => {
  vi.mocked(actions.setReserveMonthlyContributionAction).mockRejectedValueOnce(new Error("Falhou"));
  const { user } = renderUI(<ReserveContributionForm contribution={{ source: "custom", monthlyCents: 80_000, recurringMonthlyCents: 30_000, hasReserveCategory: true }} />);
  expect(screen.getByText(/Valor salvo por você/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Salvar aporte" }));
  await waitFor(() => expect(actions.setReserveMonthlyContributionAction).toHaveBeenCalledWith({ monthlyContributionCents: 80_000 }));
  expect(navigation.refresh).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Usar recorrências" }));
  await waitFor(() => expect(actions.setReserveMonthlyContributionAction).toHaveBeenLastCalledWith({ monthlyContributionCents: null }));
});

it("explains that nothing is planned without the reserve category", () => {
  renderUI(<ReserveContributionForm contribution={{ source: "recurring", monthlyCents: 0, recurringMonthlyCents: 0, hasReserveCategory: false }} />);
  expect(screen.getByLabelText("Aporte mensal na reserva")).toHaveValue("0,00");
  expect(screen.getByText(/Sem a categoria Reserva de emergência, nada é previsto/)).toBeVisible();
});
