import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { InvestmentAssetDetailView } from "@/components/finance/investment-asset-detail-view";
import * as actions from "@/app/actions/finance";
import fixtures from "../../fixtures/finance.json";
import { renderUI, freezeFinanceDate } from "../../helpers";
import { navigation } from "../../setup";

it.each([
  ["stockAsset", "buy", "Compra"],
  ["stockAsset", "sell", "Venda"],
  ["stockAsset", "correction", "Correção"],
  ["fixedAsset", "application", "Aplicação"],
  ["fixedAsset", "redemption", "Resgate"],
  ["fixedAsset", "correction", "Correção"],
] as const)(
  "registers a %s %s operation with the right financial fields",
  async (key, type, label) => {
    freezeFinanceDate();
    const asset = fixtures[key]!;
    const { user } = renderUI(
      <InvestmentAssetDetailView asset={asset as never} />,
    );
    await user.click(screen.getByRole("button", { name: "Operação" }));
    const dialog = screen.getByRole("dialog", { name: "Registrar operação" });
    await user.click(within(dialog).getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: label }));
    const quoted = type === "buy" || type === "sell";
    for (const [name, value] of [
      ["Data", "2026-07-16"],
      ["Taxas", "100"],
      ["Observação", "Operação teste"],
    ])
      fireEvent.change(within(dialog).getByLabelText(name), {
        target: { value },
      });
    if (type !== "application" && type !== "redemption")
      fireEvent.change(within(dialog).getByLabelText("Quantidade"), {
        target: { value: "2,5" },
      });
    fireEvent.change(
      within(dialog).getByLabelText(
        quoted
          ? "Preço unitário"
          : type === "correction"
            ? "Custo alvo"
            : "Valor bruto",
      ),
      { target: { value: "2000" } },
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Salvar operação" }),
    );
    await waitFor(() =>
      expect(actions.createInvestmentOperationAction).toHaveBeenCalledWith(
        expect.objectContaining({
          holdingId: asset.id,
          type,
          operatedOn: "2026-07-16",
          quantity:
            type === "application" || type === "redemption" ? "0" : "2.5",
          unitPriceCents: quoted ? 2000 : null,
          grossAmountCents: quoted ? undefined : 2000,
          targetCostCents: type === "correction" ? 2000 : null,
          feesCents: 100,
          notes: "Operação teste",
        }),
      ),
    );
    expect(navigation.refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  },
);
it.each(["stockAsset", "fixedAsset"] as const)(
  "updates valuation using the %s action and keeps errors visible",
  async (key) => {
    freezeFinanceDate();
    const asset = fixtures[key]!;
    const action =
      key === "stockAsset"
        ? actions.registerManualInvestmentQuoteAction
        : actions.updateManualInvestmentBalanceAction;
    vi.mocked(action).mockResolvedValueOnce({
      ok: false,
      error: { code: "INVALID_VALUE", message: "Valor inválido" },
    } as never);
    const { user } = renderUI(
      <InvestmentAssetDetailView asset={asset as never} />,
    );
    await user.click(
      screen.getByRole("button", {
        name: key === "stockAsset" ? "Cotação" : "Saldo",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Atualizar valoração" });
    fireEvent.change(within(dialog).getByLabelText("Valor em reais"), {
      target: { value: "2500" },
    });
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Valor inválido")).toBeVisible();
    expect(dialog).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledOnce());
    expect(action).toHaveBeenLastCalledWith(
      key === "stockAsset"
        ? { holdingId: asset.id, unitPriceCents: 2500, quotedOn: "2026-07-16" }
        : {
            holdingId: asset.id,
            currentValueCents: 2500,
            valueAsOf: "2026-07-16",
          },
    );
  },
);
it("edits an existing operation, reports a rejected update, and retries", async () => {
  const asset = fixtures.stockAsset!;
  vi.mocked(actions.updateInvestmentOperationAction).mockResolvedValueOnce({
    ok: false,
    error: { code: "INVALID", message: "Operação inválida" },
  } as never);
  const { user } = renderUI(
    <InvestmentAssetDetailView asset={asset as never} />,
  );
  const row = screen.getByText("Compra", { exact: true }).parentElement!
    .parentElement!;
  await user.click(within(row).getAllByRole("button")[0]);
  const dialog = screen.getByRole("dialog", { name: "Editar operação" });
  expect(within(dialog).getByLabelText("Quantidade")).toHaveValue("10");
  await user.click(
    within(dialog).getByRole("button", { name: "Salvar operação" }),
  );
  expect(await screen.findByText("Operação inválida")).toBeVisible();
  await user.click(
    within(dialog).getByRole("button", { name: "Salvar operação" }),
  );
  await waitFor(() => expect(navigation.refresh).toHaveBeenCalledOnce());
  expect(actions.updateInvestmentOperationAction).toHaveBeenCalledWith(
    asset.operations[0].id,
    expect.objectContaining({ holdingId: asset.id }),
  );
});
it.each([false, true])(
  "confirms deletion and handles a service failure (%s)",
  async (confirm) => {
    vi.spyOn(window, "confirm").mockReturnValue(confirm);
    vi.mocked(actions.deleteInvestmentOperationAction).mockResolvedValueOnce({
      ok: false,
      error: { code: "MISSING", message: "Operação ausente" },
    } as never);
    const { user } = renderUI(
      <InvestmentAssetDetailView asset={fixtures.stockAsset as never} />,
    );
    const row = screen.getByText("Compra", { exact: true }).parentElement!
      .parentElement!;
    await user.click(within(row).getAllByRole("button")[1]);
    expect(actions.deleteInvestmentOperationAction).toHaveBeenCalledTimes(
      confirm ? 1 : 0,
    );
    if (confirm) {
      expect(await screen.findByText("Operação ausente")).toBeVisible();
      await user.click(within(row).getAllByRole("button")[1]);
      await waitFor(() => expect(navigation.refresh).toHaveBeenCalledOnce());
    }
  },
);
it("explains unknown cost and stale quote values without operation history", () => {
  const asset = {
    ...fixtures.stockAsset,
    position: null,
    operations: [],
    resultCents: null,
    institutionName: null,
    quotes: [{ ...fixtures.stockAsset!.quotes[0], isStale: true }],
  };
  renderUI(<InvestmentAssetDetailView asset={asset as never} />);
  expect(screen.getByText(/Sem operações: custo/)).toBeVisible();
  expect(screen.getByText(/desatualizada/)).toBeVisible();
  expect(screen.getByText("Desconhecida")).toBeVisible();
});
