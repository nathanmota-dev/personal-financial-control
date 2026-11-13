import { screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import * as actions from "@/app/actions/finance";
import { InvestmentOverviewView } from "@/components/finance/investment-overview-view";
import { InvestmentsViewSection1 } from "@/components/finance/investments-view-investments-view-section1";
import { SettingsReservePanel } from "@/components/finance/settings/settings-reserve-panel";
import Page from "@/app/(finance)/settings/page";
import type { BankReserveSplit } from "@/lib/interfaces/bank-reserve";
import fixtures from "../../fixtures/finance.json";
import { renderUI } from "../../helpers";
import { navigation } from "../../setup";

const split = (overrides: Partial<BankReserveSplit> = {}): BankReserveSplit => ({
  totalCents: 5_000_000,
  configuredReserveCents: 4_000_000,
  reserveCents: 4_000_000,
  portfolioCents: 1_000_000,
  exceedsTotal: false,
  valueAsOf: "2026-07-15",
  realizedYield: { monthlyRateBps: 90, periodDays: 28, reserveMonthlyYieldCents: 36_000 },
  ...overrides,
});

const overview = (bank: BankReserveSplit) => ({ ...fixtures.overview, totalCents: bank.totalCents, reserve: { ...fixtures.overview.reserve, amountCents: bank.reserveCents, configured: bank.configuredReserveCents !== null }, portfolioCents: bank.portfolioCents, bank });
const projection = (bank: BankReserveSplit) => ({ ...fixtures.projection, source: "bank" as const, bank, currentBalanceCents: bank.reserveCents });

it("sets the reserve over the bank's total from the investments overview", async () => {
  const { user } = renderUI(<InvestmentOverviewView overview={overview(split({ configuredReserveCents: null, reserveCents: 0, portfolioCents: 5_000_000 })) as never} />);
  expect(screen.getByText("Ainda não definida")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Definir reserva" }));
  const dialog = screen.getByRole("dialog", { name: "Quanto é reserva?" });
  await user.click(within(dialog).getByRole("button", { name: "Metade" }));
  expect(within(dialog).getByLabelText("Reserva")).toHaveValue("25.000,00");
  await user.click(within(dialog).getByRole("button", { name: "Salvar reserva" }));
  await waitFor(() => expect(actions.setBankReserveAmountAction).toHaveBeenCalledWith({ reserveAmountCents: 2_500_000 }));
  expect(navigation.refresh).toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("blocks an amount above the total and keeps the dialog open when saving fails", async () => {
  vi.mocked(actions.setBankReserveAmountAction).mockRejectedValueOnce(new Error("Falhou"));
  const { user } = renderUI(<InvestmentOverviewView overview={overview(split({ exceedsTotal: true })) as never} />);
  expect(screen.getByText(/ficou abaixo da reserva definida/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Ajustar reserva" }));
  const dialog = screen.getByRole("dialog", { name: "Quanto é reserva?" });
  const input = within(dialog).getByLabelText("Reserva");
  expect(input).toHaveValue("40.000,00");
  await user.clear(input);
  await user.type(input, "6000000");
  expect(within(dialog).getByRole("alert")).toHaveTextContent("não pode passar do total");
  expect(within(dialog).getByRole("button", { name: "Salvar reserva" })).toBeDisabled();
  await user.click(within(dialog).getByRole("button", { name: "Tudo" }));
  await user.click(within(dialog).getByRole("button", { name: "Salvar reserva" }));
  await waitFor(() => expect(actions.setBankReserveAmountAction).toHaveBeenCalledWith({ reserveAmountCents: 5_000_000 }));
  expect(screen.getByRole("dialog", { name: "Quanto é reserva?" })).toBeVisible();
  await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("shows real figures on the reserve hero when positions come from the bank", () => {
  renderUI(<InvestmentsViewSection1 projection={projection(split()) as never} />);
  expect(screen.getByRole("heading", { name: "Saldo da reserva" })).toBeVisible();
  expect(screen.getByText(/Valor definido em Investimentos/)).toBeVisible();
  expect(screen.getByText("Rentabilidade real")).toBeVisible();
  expect(screen.getByText("Pela rentabilidade real de 28 dias")).toBeVisible();
  expect(screen.queryByText(/Conferido em/)).toBeNull();
});

it("explains a reserve not yet set and waits for more syncs before showing yield", () => {
  renderUI(<InvestmentsViewSection1 projection={projection(split({ configuredReserveCents: null, reserveCents: 0, realizedYield: null })) as never} />);
  expect(screen.getByText(/Defina em Investimentos/)).toBeVisible();
  expect(screen.getByText("Aguardando mais sincronizações")).toBeVisible();
});

it("points the settings panel to the overview in bank mode and keeps the manual form otherwise", () => {
  const { unmount } = renderUI(<SettingsReservePanel projection={projection(split()) as never} />);
  expect(screen.getByRole("link", { name: "Definir reserva" })).toHaveAttribute("href", "/investments");
  unmount();
  renderUI(<SettingsReservePanel projection={{ ...fixtures.projection, source: "manual", bank: null } as never} />);
  expect(screen.getByRole("heading", { name: "Premissas e conferência" })).toBeVisible();
});

it("opens the settings tab named in the address", async () => {
  vi.stubEnv("DEMO_MODE", "false");
  renderUI(await Page({ searchParams: Promise.resolve({ tab: "investments" }) }));
  expect(screen.getByRole("tab", { name: "Investimentos" })).toHaveAttribute("aria-selected", "true");
});
