import { screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import * as actions from "@/app/actions/finance";
import { InvestmentOverviewView } from "@/components/finance/investment-overview-view";
import { InvestmentsView } from "@/components/finance/investments-view";
import type { BankReserveSplit } from "@/lib/interfaces/bank-reserve";
import type { ReserveDestinationContribution } from "@/lib/interfaces/reserve-destination";
import type { StalePosition } from "@/lib/interfaces/stale-positions";
import type { TransactionRow } from "@/lib/interfaces/transactions";
import { TransactionDestinationButton } from "@/components/finance/transaction-destination-button";
import fixtures from "../../fixtures/finance.json";
import { renderUI } from "../../helpers";
import { navigation } from "../../setup";

const bank: BankReserveSplit = {
  totalCents: 4_000_000,
  configuredReserveCents: 1_000_000,
  reserveCents: 1_000_000,
  portfolioCents: 3_000_000,
  exceedsTotal: false,
  valueAsOf: "2026-07-15",
  realizedYield: null,
};

const contributions: ReserveDestinationContribution[] = [
  { id: "33333333-3333-4333-8333-333333333333", transactionDate: "2026-07-10", description: "APLICACAO CDB 13", amountCents: 100_000, accountName: "Itaú", reserveShareCents: null, pending: true, beforeReserve: false },
  { id: "44444444-4444-4444-8444-444444444444", transactionDate: "2026-07-05", description: "APLICACAO TESOURO", amountCents: 50_000, accountName: null, reserveShareCents: 20_000, pending: false, beforeReserve: true },
];

const overview = (reserveDestinations: ReserveDestinationContribution[], split: BankReserveSplit | null = bank, stalePositions: StalePosition[] = []) => ({
  ...fixtures.overview,
  totalCents: bank.totalCents,
  reserve: { ...fixtures.overview.reserve, amountCents: bank.reserveCents, configured: true },
  portfolioCents: bank.portfolioCents,
  bank: split,
  pendingWithdrawals: [],
  reserveDestinations,
  stalePositions,
});

const openDialog = async (user: ReturnType<typeof renderUI>["user"], button: string) => {
  await user.click(screen.getByRole("button", { name: button }));
  return screen.getByRole("dialog", { name: "Para onde foi cada aporte?" });
};

it("asks for the destination of pending contributions and saves a split", async () => {
  const { user } = renderUI(<InvestmentOverviewView overview={overview(contributions) as never} />);
  expect(screen.getByText("1 aporte para classificar.")).toBeVisible();
  const dialog = await openDialog(user, "Classificar aportes");
  expect(within(dialog).getByText(/O saldo da conta não muda/)).toBeVisible();
  const first = within(dialog).getByRole("form", { name: /Destino de APLICACAO CDB 13/ });
  await user.type(within(first).getByLabelText("Parte da reserva"), "600,00");
  expect(within(first).getByText(/Investimentos:/)).toHaveTextContent("400,00");
  await user.click(within(first).getByRole("button", { name: "Salvar destino" }));
  await waitFor(() => expect(actions.classifyReserveDestinationAction).toHaveBeenCalledWith({ transactionId: contributions[0].id, reserveCents: 60_000 }));
  expect(navigation.refresh).toHaveBeenCalled();
});

it("fills a shortcut, blocks a share above the contribution and keeps a classified one unchanged", async () => {
  const { user } = renderUI(<InvestmentOverviewView overview={overview(contributions) as never} />);
  const dialog = await openDialog(user, "Classificar aportes");
  const second = within(dialog).getByRole("form", { name: /Destino de APLICACAO TESOURO/ });
  const save = within(second).getByRole("button", { name: "Salvar destino" });
  expect(save).toBeDisabled();
  await user.click(within(second).getByRole("button", { name: "Tudo reserva" }));
  expect(within(second).getByLabelText("Parte da reserva")).toHaveValue("500,00");
  await user.click(save);
  await waitFor(() => expect(actions.classifyReserveDestinationAction).toHaveBeenCalledWith({ transactionId: contributions[1].id, reserveCents: 50_000 }));
  const input = within(second).getByLabelText("Parte da reserva");
  await user.clear(input);
  await user.type(input, "900,00");
  expect(within(second).getByRole("alert")).toHaveTextContent("não pode passar do valor do aporte");
  expect(save).toBeDisabled();
});

it("does not refresh when saving fails", async () => {
  vi.mocked(actions.classifyReserveDestinationAction).mockRejectedValueOnce(new Error("A reserva passaria do total investido."));
  const { user } = renderUI(<InvestmentOverviewView overview={overview(contributions.slice(0, 1)) as never} />);
  const dialog = await openDialog(user, "Classificar aportes");
  await user.click(within(dialog).getByRole("button", { name: "Tudo investimentos" }));
  await user.click(within(dialog).getByRole("button", { name: "Salvar destino" }));
  await waitFor(() => expect(actions.classifyReserveDestinationAction).toHaveBeenCalledWith({ transactionId: contributions[0].id, reserveCents: 0 }));
  expect(navigation.refresh).not.toHaveBeenCalled();
});

it("offers a review without pending contributions and shows nothing outside bank mode", async () => {
  const { user, unmount } = renderUI(<InvestmentOverviewView overview={overview(contributions.slice(1)) as never} />);
  expect(screen.queryByText(/para classificar/)).toBeNull();
  const dialog = await openDialog(user, "Revisar aportes");
  await user.click(within(dialog).getAllByRole("button", { name: "Fechar" }).find((button) => button.textContent === "Fechar")!);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  unmount();
  const { unmount: unmountEmpty } = renderUI(<InvestmentOverviewView overview={overview([]) as never} />);
  expect(screen.queryByRole("button", { name: /aportes/ })).toBeNull();
  unmountEmpty();
  renderUI(<InvestmentOverviewView overview={overview(contributions, null) as never} />);
  expect(screen.queryByRole("button", { name: /aportes/ })).toBeNull();
});

it("shows the notice on the reserve page in bank mode", () => {
  const projection = { ...fixtures.projection, source: "bank" as const };
  renderUI(<InvestmentsView projection={projection as never} contributionHistory={fixtures.history as never} reserveDestinations={contributions} />);
  expect(screen.getByText("1 aporte para classificar.")).toBeVisible();
});

it("warns that a classified contribution predates the reserve", async () => {
  const { user } = renderUI(<InvestmentOverviewView overview={overview(contributions) as never} />);
  const dialog = await openDialog(user, "Classificar aportes");
  const second = within(dialog).getByRole("form", { name: /Destino de APLICACAO TESOURO/ }).closest("li")!;
  expect(within(second).getByText(/Anterior ao valor que você definiu para a reserva/)).toBeVisible();
});

const stale: StalePosition[] = [
  { id: "55555555-5555-4555-8555-555555555555", name: "CDB - ITAU UNIBANCO S.A.", currentValueCents: 22_545, valueAsOf: "2026-05-20" },
  { id: "66666666-6666-4666-8666-666666666666", name: "CDB - ITAU UNIBANCO S.A.", currentValueCents: 20_008, valueAsOf: "2026-06-08" },
];

it("lists positions the bank stopped updating and retires one", async () => {
  const { user } = renderUI(<InvestmentOverviewView overview={overview([], bank, stale) as never} />);
  expect(screen.getByText(/2 posições sem atualização do banco há mais de 30 dias/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Revisar posições" }));
  const dialog = screen.getByRole("dialog", { name: "Posições paradas no banco" });
  expect(within(dialog).getByText(/Nenhum lançamento é criado/)).toBeVisible();
  await user.click(within(dialog).getAllByRole("button", { name: /Dar baixa em/ })[0]);
  await waitFor(() => expect(actions.retireStalePositionAction).toHaveBeenCalledWith({ holdingId: stale[0].id }));
  expect(navigation.refresh).toHaveBeenCalled();
});

it("keeps the stale positions when retiring fails, and hides them outside bank mode", async () => {
  vi.mocked(actions.retireStalePositionAction).mockRejectedValueOnce(new Error("O banco atualizou esta posição recentemente."));
  const { user, unmount } = renderUI(<InvestmentOverviewView overview={overview([], bank, stale.slice(0, 1)) as never} />);
  expect(screen.getByText(/1 posição sem atualização/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Revisar posições" }));
  await user.click(screen.getByRole("button", { name: /Dar baixa em/ }));
  await waitFor(() => expect(actions.retireStalePositionAction).toHaveBeenCalled());
  expect(navigation.refresh).not.toHaveBeenCalled();
  unmount();
  renderUI(<InvestmentOverviewView overview={overview([], null, stale) as never} />);
  expect(screen.queryByText(/sem atualização/)).toBeNull();
});

const contributionRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: contributions[0].id, accountId: "a", categoryId: null, recurringTemplateId: null, type: "investment_contribution", status: "posted", amountCents: 100_000,
  transactionDate: "2026-07-10", competenceMonth: "2026-07", description: "APLICACAO CDB 13", fundingSource: "account", fundingLink: null, isGeneratedByFunding: false,
  account: { id: "a", name: "Itaú" }, category: null, investmentOrigin: "pending", reserveShareCents: null, ...overrides,
});

it("opens the destination of a pending contribution from the transaction list", async () => {
  const { user } = renderUI(<TransactionDestinationButton transaction={contributionRow()} />);
  await user.click(screen.getByRole("button", { name: "Definir destino" }));
  const dialog = screen.getByRole("dialog", { name: "Para onde foi cada aporte?" });
  await user.click(within(dialog).getByRole("button", { name: "Tudo reserva" }));
  await user.click(within(dialog).getByRole("button", { name: "Salvar destino" }));
  await waitFor(() => expect(actions.classifyReserveDestinationAction).toHaveBeenCalledWith({ transactionId: contributions[0].id, reserveCents: 100_000 }));
});

it("shows no destination button for other transactions", () => {
  const { container } = renderUI(
    <>
      <TransactionDestinationButton transaction={contributionRow({ investmentOrigin: null })} />
      <TransactionDestinationButton transaction={contributionRow({ type: "income", investmentOrigin: "pending" })} />
    </>,
  );
  expect(container.querySelector("button")).toBeNull();
});
