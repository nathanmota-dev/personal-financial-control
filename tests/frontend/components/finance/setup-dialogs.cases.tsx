import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AccountSetupDialog,
  CategorySetupDialog,
  SetupCallout,
} from "@/components/finance/setup-dialogs";
import {
  createAccountAction,
  createCategoryAction,
  updateAccountAction,
  updateCategoryAction,
} from "@/app/actions/finance";
import fixtures from "../../fixtures/finance.json";
import { renderUI } from "../../helpers";

describe("financial setup", () => {
  it("creates an account with a formatted starting balance", async () => {
    const { user } = renderUI(<AccountSetupDialog />);
    await user.click(screen.getByRole("button", { name: "Nova conta" }));
    const dialog = screen.getByRole("dialog", { name: "Nova conta" });
    await user.type(within(dialog).getByLabelText("Nome"), "Carteira pessoal");
    fireEvent.change(within(dialog).getByLabelText("Saldo inicial (R$)"), {
      target: { value: "12345" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Criar conta" }),
    );
    await waitFor(() =>
      expect(createAccountAction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Carteira pessoal",
          initialBalanceCents: 12345,
        }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("edits closing and due dates of an existing card", async () => {
    const card = fixtures.accounts.find(
      (account) => account.type === "credit",
    )!;
    const { user } = renderUI(<AccountSetupDialog account={card as never} />);
    await user.click(screen.getByRole("button", { name: "Nova conta" }));
    const dialog = screen.getByRole("dialog", { name: "Editar conta" });
    fireEvent.change(within(dialog).getByLabelText("Dia do fechamento"), {
      target: { value: "15" },
    });
    fireEvent.change(within(dialog).getByLabelText("Dia do vencimento"), {
      target: { value: "22" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() =>
      expect(updateAccountAction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: card.id,
          creditClosingDay: 15,
          creditDueDay: 22,
        }),
      ),
    );
  });
  it.each([false, true])(
    "creates or edits a category (editing: %s)",
    async (editing) => {
      const category = fixtures.categories[0];
      const { user } = renderUI(
        <CategorySetupDialog
          category={editing ? (category as never) : undefined}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Nova categoria" }));
      const dialog = screen.getByRole("dialog");
      await user.clear(within(dialog).getByLabelText("Nome"));
      await user.type(within(dialog).getByLabelText("Nome"), "Categoria teste");
      await user.click(
        within(dialog).getByRole("button", {
          name: editing ? "Salvar alterações" : "Criar categoria",
        }),
      );
      await waitFor(() =>
        expect(
          editing ? updateCategoryAction : createCategoryAction,
        ).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Categoria teste" }),
        ),
      );
    },
  );
  it("opens both setup forms from the callout", async () => {
    const { user } = renderUI(
      <SetupCallout title="Configurar" description="Cadastre seus dados" />,
    );
    expect(screen.getByText("Cadastre seus dados")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(screen.getByRole("dialog", { name: "Nova conta" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await user.click(screen.getByRole("button", { name: "Criar categoria" }));
    expect(
      screen.getByRole("dialog", { name: "Nova categoria" }),
    ).toBeVisible();
  });
});
