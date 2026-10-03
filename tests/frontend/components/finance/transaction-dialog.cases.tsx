import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import {
  createTransactionAction,
  updateTransactionAction,
} from "@/app/actions/finance";
import fixtures from "../../fixtures/finance.json";
import { renderUI } from "../../helpers";
import { navigation } from "../../setup";

const accounts = fixtures.accounts.filter(
  (account) => account.type !== "credit",
);
describe("transaction dialog", () => {
  it("creates an uncategorized expense in cents and refreshes after success", async () => {
    const { user } = renderUI(
      <TransactionDialog
        accounts={accounts as never}
        categories={fixtures.categories as never}
        month="2026-07"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Novo lançamento" }));
    const dialog = screen.getByRole("dialog", { name: "Novo lançamento" });
    fireEvent.change(within(dialog).getByLabelText("Valor"), {
      target: { value: "1234" },
    });
    await user.type(
      within(dialog).getByLabelText("Descrição"),
      "Mercado teste",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Criar lançamento" }),
    );
    await waitFor(() =>
      expect(createTransactionAction).toHaveBeenCalledWith(
        expect.objectContaining({
          amountCents: 1234,
          description: "Mercado teste",
          type: "expense",
          transactionDate: "2026-07-01",
          competenceMonth: "2026-07",
          categoryId: null,
        }),
      ),
    );
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("updates an existing transaction and retains validation failures for correction", async () => {
    const transaction = fixtures.transactions.find(
      (item) => item.type === "income",
    )!;
    vi.mocked(updateTransactionAction).mockResolvedValueOnce({
      ok: false,
      error: {
        code: "INVALID_NAME",
        message: "Nome obrigatório",
        field: "name",
      },
    });
    const { user } = renderUI(
      <TransactionDialog
        accounts={accounts as never}
        categories={fixtures.categories as never}
        transaction={transaction as never}
        month="2026-07"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Novo lançamento" }));
    const dialog = screen.getByRole("dialog", { name: "Editar lançamento" });
    expect(within(dialog).getByLabelText("Descrição")).toHaveValue(
      transaction.description,
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        "Nome obrigatório",
      ),
    );
    expect(navigation.refresh).not.toHaveBeenCalled();
    await user.clear(within(dialog).getByLabelText("Descrição"));
    await user.type(
      within(dialog).getByLabelText("Descrição"),
      "Salário atualizado",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() =>
      expect(updateTransactionAction).toHaveBeenLastCalledWith(
        expect.objectContaining({
          id: transaction.id,
          description: "Salário atualizado",
        }),
      ),
    );
  });
  it("offers setup when there are no accounts", async () => {
    const { user } = renderUI(
      <TransactionDialog accounts={[]} categories={[]} month="2026-07" />,
    );
    await user.click(screen.getByRole("button", { name: "Novo lançamento" }));
    expect(screen.getByText("Sem contas cadastradas")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Criar lançamento" }),
    ).toBeNull();
  });
});
