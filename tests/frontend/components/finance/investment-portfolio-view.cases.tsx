import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { InvestmentPortfolioView } from "@/components/finance/investment-portfolio-view";
import * as actions from "@/app/actions/finance";
import fixtures from "../../fixtures/finance.json";
import { renderUI, freezeFinanceDate } from "../../helpers";
import { navigation } from "../../setup";

it("creates a manual holding with all fields and converts its value to cents", async () => {
  freezeFinanceDate();
  const { user } = renderUI(
    <InvestmentPortfolioView dashboard={fixtures.portfolio as never} />,
  );
  await user.click(screen.getAllByRole("button", { name: "Novo ativo" })[0]);
  const dialog = screen.getByRole("dialog", { name: "Cadastrar ativo" });
  for (const [label, value] of [
    ["Nome do ativo", "Ativo teste"],
    ["Ticker (opcional)", "BOVA11"],
    ["Instituição (opcional)", "Corretora"],
    ["Valor atual (R$)", "12345"],
    ["Data do valor", "2026-07-16"],
    ["Observações (opcional)", "Saldo manual"],
  ])
    fireEvent.change(within(dialog).getByLabelText(label), {
      target: { value },
    });
  await user.click(
    within(dialog).getByRole("button", { name: "Cadastrar ativo" }),
  );
  await waitFor(() =>
    expect(actions.createInvestmentHoldingAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ativo teste",
        ticker: "BOVA11",
        institutionName: "Corretora",
        currentValueCents: 12345,
        valueAsOf: "2026-07-16",
        notes: "Saldo manual",
      }),
    ),
  );
  expect(navigation.refresh).toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("updates existing holding values and keeps the dialog open on failure", async () => {
  vi.mocked(actions.updateInvestmentHoldingAction).mockRejectedValueOnce(
    new Error("Não foi possível salvar"),
  );
  const holding = fixtures.portfolio.holdings[0];
  const { user } = renderUI(
    <InvestmentPortfolioView dashboard={fixtures.portfolio as never} />,
  );
  await user.click(
    screen.getAllByRole("button", { name: `Editar ${holding.name}` })[0],
  );
  const dialog = screen.getByRole("dialog", { name: "Editar ativo" });
  expect(within(dialog).getByLabelText("Nome do ativo")).toHaveValue(
    holding.name,
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Salvar alterações" }),
  );
  expect(await screen.findByText("Não foi possível salvar")).toBeVisible();
  expect(dialog).toBeVisible();
  await user.click(
    within(dialog).getByRole("button", { name: "Salvar alterações" }),
  );
  await waitFor(() => expect(navigation.refresh).toHaveBeenCalled());
  expect(actions.updateInvestmentHoldingAction).toHaveBeenLastCalledWith(
    expect.objectContaining({
      id: holding.id,
      currentValueCents: holding.currentValueCents,
    }),
  );
});
it.each([false, true])(
  "creates and edits a patrimonial purpose (editing %s)",
  async (editing) => {
    const purpose = fixtures.portfolio.purposes[0];
    const { user } = renderUI(
      <InvestmentPortfolioView dashboard={fixtures.portfolio as never} />,
    );
    await user.click(
      editing
        ? screen.getByRole("button", { name: `Editar ${purpose.name}` })
        : screen.getByRole("button", { name: "Nova" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Nome"), {
      target: { value: "Objetivo teste" },
    });
    fireEvent.change(within(dialog).getByLabelText("Alvo opcional (R$)"), {
      target: { value: "50000" },
    });
    fireEvent.change(within(dialog).getByLabelText("Observações (opcional)"), {
      target: { value: "Planejamento" },
    });
    await user.click(
      within(dialog).getByRole("button", {
        name: editing ? "Salvar alterações" : "Criar caixinha",
      }),
    );
    await waitFor(() =>
      expect(
        editing
          ? actions.updateInvestmentPurposeAction
          : actions.createInvestmentPurposeAction,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Objetivo teste",
          targetAmountCents: 50000,
          notes: "Planejamento",
        }),
      ),
    );
  },
);
it("modifies an existing allocation and removes it without changing asset value", async () => {
  const { user } = renderUI(
    <InvestmentPortfolioView dashboard={fixtures.portfolio as never} />,
  );
  await user.click(screen.getAllByTitle("Editar alocação")[0]);
  const dialog = screen.getByRole("dialog", { name: "Editar alocação" });
  fireEvent.change(within(dialog).getByLabelText("Valor alocado (R$)"), {
    target: { value: "20000" },
  });
  fireEvent.change(within(dialog).getByLabelText("Data da alocação"), {
    target: { value: "2026-07-16" },
  });
  fireEvent.change(within(dialog).getByLabelText("Observações (opcional)"), {
    target: { value: "Revisado" },
  });
  await user.click(
    within(dialog).getByRole("button", { name: "Salvar alocação" }),
  );
  await waitFor(() =>
    expect(
      actions.upsertInvestmentPurposeAllocationAction,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 20000, notes: "Revisado" }),
    ),
  );
  await user.click(screen.getAllByTitle("Editar alocação")[0]);
  await user.click(screen.getByRole("button", { name: "Remover alocação" }));
  await waitFor(() =>
    expect(
      actions.deleteInvestmentPurposeAllocationAction,
    ).toHaveBeenCalledOnce(),
  );
});
it("requires positive allocation amounts and cancels without saving", async () => {
  const holding = fixtures.portfolio.holdings[0];
  const { user } = renderUI(
    <InvestmentPortfolioView dashboard={fixtures.portfolio as never} />,
  );
  await user.click(
    screen.getAllByRole("button", { name: `Alocar ${holding.name}` })[0],
  );
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Valor alocado (R$)"), {
    target: { value: "0" },
  });
  await user.click(
    within(dialog).getByRole("button", { name: "Salvar alocação" }),
  );
  expect(
    await screen.findByText("Informe um valor alocado maior que zero."),
  ).toBeVisible();
  expect(
    actions.upsertInvestmentPurposeAllocationAction,
  ).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("shows empty states and prevents allocating without holdings", async () => {
  const dashboard = {
    ...fixtures.portfolio,
    holdings: [],
    allocations: [],
    purposes: [],
    distribution: [],
    investmentProjection: null,
    globalBalanceCents: null,
    reconciliation: { state: "not_configured", differenceCents: null },
    options: { assetClasses: [], instrumentTypes: [] },
  };
  const { user } = renderUI(
    <InvestmentPortfolioView dashboard={dashboard as never} />,
  );
  expect(screen.getByText("Nenhuma caixinha criada")).toBeVisible();
  expect(
    screen.getAllByText("Nenhuma posição cadastrada").length,
  ).toBeGreaterThan(0);
  await user.click(screen.getAllByRole("button", { name: "Novo ativo" })[0]);
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(actions.createInvestmentHoldingAction).not.toHaveBeenCalled();
});
it.each([false, true])(
  "requires confirmation before archiving zeroed assets and purposes (%s)",
  async (confirm) => {
    vi.spyOn(window, "confirm").mockReturnValue(confirm);
    const holding = {
      ...fixtures.portfolio.holdings[0],
      currentValueCents: 0,
      allocationCount: 0,
      allocations: [],
    };
    const purpose = {
      ...fixtures.portfolio.purposes[0],
      allocatedCents: 0,
      holdingCount: 0,
      progressPercentage: null,
      targetAmountCents: null,
      lastAllocatedOn: null,
    };
    const { user } = renderUI(
      <InvestmentPortfolioView
        dashboard={
          {
            ...fixtures.portfolio,
            holdings: [holding],
            purposes: [purpose],
            allocations: [],
          } as never
        }
      />,
    );
    await user.click(
      screen.getAllByRole("button", { name: `Arquivar ${holding.name}` })[0],
    );
    await user.click(
      screen.getByRole("button", { name: `Arquivar ${purpose.name}` }),
    );
    await waitFor(() =>
      expect(actions.archiveInvestmentPurposeAction).toHaveBeenCalledTimes(
        confirm ? 1 : 0,
      ),
    );
    expect(actions.archiveInvestmentHoldingAction).toHaveBeenCalledTimes(
      confirm ? 1 : 0,
    );
  },
);
