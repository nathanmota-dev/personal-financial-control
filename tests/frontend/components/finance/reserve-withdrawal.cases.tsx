import { screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import * as actions from "@/app/actions/finance";
import { InvestmentOverviewView } from "@/components/finance/investment-overview-view";
import type { BankReserveSplit } from "@/lib/interfaces/bank-reserve";
import type { PendingReserveWithdrawal } from "@/lib/interfaces/reserve-withdrawal";
import fixtures from "../../fixtures/finance.json";
import { renderUI } from "../../helpers";
import { navigation } from "../../setup";

const bank: BankReserveSplit = {
  totalCents: 4_000_000,
  configuredReserveCents: 3_000_000,
  reserveCents: 3_000_000,
  portfolioCents: 1_000_000,
  exceedsTotal: false,
  valueAsOf: "2026-07-15",
  realizedYield: null,
};

const pending: PendingReserveWithdrawal[] = [
  { id: "11111111-1111-4111-8111-111111111111", transactionDate: "2026-07-10", description: "RESGATE CDB", amountCents: 200_000, accountName: "Itaú" },
  { id: "22222222-2222-4222-8222-222222222222", transactionDate: "2026-07-11", description: "Resgate COFRINHOS", amountCents: 50_000, accountName: null },
];

const overview = (pendingWithdrawals: PendingReserveWithdrawal[], split: BankReserveSplit | null = bank) => ({
  ...fixtures.overview,
  totalCents: bank.totalCents,
  reserve: { ...fixtures.overview.reserve, amountCents: bank.reserveCents, configured: true },
  portfolioCents: bank.portfolioCents,
  bank: split,
  pendingWithdrawals,
});

it("lists bank withdrawals waiting for an origin and classifies one as reserve", async () => {
  const { user } = renderUI(<InvestmentOverviewView overview={overview(pending) as never} />);
  expect(screen.getByText("2 retiradas para classificar.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Classificar" }));
  const dialog = screen.getByRole("dialog", { name: "De onde saiu cada retirada?" });
  expect(within(dialog).getByText(/O saldo da conta não muda/)).toBeVisible();
  expect(within(dialog).getByText("RESGATE CDB")).toBeVisible();
  expect(within(dialog).getByText(/Itaú/)).toBeVisible();
  const first = within(dialog).getByRole("group", { name: /Origem de RESGATE CDB/ });
  await user.click(within(first).getByRole("button", { name: "Reserva" }));
  await waitFor(() => expect(actions.classifyReserveWithdrawalAction).toHaveBeenCalledWith({ transactionId: pending[0].id, origin: "reserve" }));
  expect(navigation.refresh).toHaveBeenCalled();
  const second = within(dialog).getByRole("group", { name: /Origem de Resgate COFRINHOS/ });
  await user.click(within(second).getByRole("button", { name: "Carteira" }));
  await waitFor(() => expect(actions.classifyReserveWithdrawalAction).toHaveBeenCalledWith({ transactionId: pending[1].id, origin: "portfolio" }));
  await user.click(within(dialog).getAllByRole("button", { name: "Fechar" }).find((button) => button.textContent === "Fechar")!);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("keeps the dialog open and does not refresh when the classification fails", async () => {
  vi.mocked(actions.classifyReserveWithdrawalAction).mockRejectedValueOnce(new Error("Esta retirada já foi classificada."));
  const { user } = renderUI(<InvestmentOverviewView overview={overview(pending.slice(0, 1)) as never} />);
  expect(screen.getByText("1 retirada para classificar.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Classificar" }));
  const dialog = screen.getByRole("dialog", { name: "De onde saiu cada retirada?" });
  await user.click(within(dialog).getByRole("button", { name: "Carteira" }));
  await waitFor(() => expect(actions.classifyReserveWithdrawalAction).toHaveBeenCalled());
  expect(navigation.refresh).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog", { name: "De onde saiu cada retirada?" })).toBeVisible();
});

it("shows no notice without pending withdrawals or outside bank mode", () => {
  const { unmount } = renderUI(<InvestmentOverviewView overview={overview([]) as never} />);
  expect(screen.queryByText(/para classificar/)).toBeNull();
  unmount();
  renderUI(<InvestmentOverviewView overview={overview(pending, null) as never} />);
  expect(screen.queryByText(/para classificar/)).toBeNull();
});
