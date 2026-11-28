import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { listRecurringLinkCandidatesAction, saveRecurringLinksAction } from "@/app/actions/finance";
import { RecurringAgenda } from "@/components/finance/recurring-agenda";
import { RecurringCard } from "@/components/finance/recurring-card";
import type { RecurringLinkCandidate } from "@/lib/interfaces/recurring-occurrences";
import { emptyRecurringOccurrences } from "@/lib/recurring-status";
import fixtures from "../../fixtures/finance.json";
import { renderUI } from "../../helpers";

const accounts = fixtures.accounts as never;
const categories = fixtures.categories as never;
const rent = fixtures.recurring.find((template) => template.description === "Aluguel")!;

function candidate(id: string, values: Partial<RecurringLinkCandidate>): RecurringLinkCandidate {
  return { id, kind: "transaction", type: "expense", categoryId: null, categoryName: "Moradia", amountCents: 180000, date: "2026-11-08", description: id, accountName: "Conta principal", isLinked: false, isSuggested: false, ...values };
}

function renderCard(occurrences = emptyRecurringOccurrences("2026-11")) {
  return renderUI(
    <ul>
      <RecurringCard template={{ ...rent, lastGeneratedMonth: "2027-10" } as never} accounts={accounts} categories={categories} month="2026-11" occurrences={occurrences} />
    </ul>,
  );
}

describe("recurring occurrence links", () => {
  it("shows the month's own occurrence instead of the last generated month", () => {
    renderCard();
    expect(screen.getByRole("button", { name: /Sem lançamento em .* Vincular/ })).toBeVisible();
  });

  it("shows the amount that paid the rule and how it differs from the plan", () => {
    renderCard({
      month: "2026-11",
      recordedKeys: [`${rent.id}:2026-11`],
      byTemplate: { [rent.id]: { templateId: rent.id, recordedCents: 185000, entries: [] } },
    });
    const status = screen.getByRole("button", { name: /Lançado em/ });
    expect(status).toHaveTextContent("R$ 1.850,00");
    expect(status).toHaveTextContent(/previsto R\$ 1\.\d{3},00/);
    expect(status).not.toHaveTextContent("Vincular");
  });

  it("links the entries picked in the dialog, keeping the automatic one checked", async () => {
    vi.mocked(listRecurringLinkCandidatesAction).mockResolvedValue({
      ok: true,
      data: {
        generated: [],
        candidates: [
          candidate("PIX ALUGUEL", { isLinked: true, isSuggested: true }),
          candidate("CONDOMINIO", { kind: "card", amountCents: 5000, accountName: "Cartão" }),
          candidate("MERCADO", { amountCents: 9000 }),
        ],
      },
    });
    const { user } = renderCard();
    await user.click(screen.getByRole("button", { name: /Sem lançamento/ }));
    const dialog = await screen.findByRole("dialog", { name: "Lançamentos de Aluguel" });
    const list = await within(dialog).findByRole("list", { name: "Lançamentos do mês" });
    expect(within(list).getByRole("checkbox", { name: /PIX ALUGUEL/ })).toBeChecked();
    expect(within(list).getByText("Sugerido")).toBeVisible();

    await user.type(within(dialog).getByRole("textbox", { name: "Filtrar lançamentos" }), "condo");
    expect(within(list).queryByText("MERCADO")).toBeNull();
    await user.click(within(list).getByRole("checkbox", { name: /CONDOMINIO/ }));
    expect(within(dialog).getByText(/Selecionado R\$ 1\.850,00/)).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Salvar vínculos" }));

    await waitFor(() =>
      expect(saveRecurringLinksAction).toHaveBeenCalledWith({ templateId: rent.id, month: "2026-11", transactionIds: ["PIX ALUGUEL"], chargeIds: ["CONDOMINIO"] }),
    );
    expect(listRecurringLinkCandidatesAction).toHaveBeenCalledWith(rent.id, "2026-11");
  });

  it("shows a generated occurrence read-only", async () => {
    vi.mocked(listRecurringLinkCandidatesAction).mockResolvedValue({
      ok: true,
      data: { generated: [{ id: "g", kind: "transaction", source: "generated", description: "Aluguel", date: "2026-11-08", amountCents: 180000, accountName: "Conta" }], candidates: [candidate("MERCADO", {})] },
    });
    const { user } = renderCard();
    await user.click(screen.getByRole("button", { name: /Sem lançamento/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByRole("list", { name: "Gerados pelo app" })).toBeVisible();
    expect(within(dialog).queryByRole("button", { name: "Salvar vínculos" })).toBeNull();
  });

  it("counts the agenda by recorded occurrences", () => {
    renderUI(<RecurringAgenda month="2026-11" occurrences={{ month: "2026-11", byTemplate: {}, recordedKeys: [`${rent.id}:2026-11`] }} templates={[rent] as never} />);
    expect(screen.getByText("1 de 1 lançadas")).toBeVisible();
    expect(screen.getByLabelText("Já lançado")).toBeVisible();
  });

  it("explains a failed load and an empty month", async () => {
    vi.mocked(listRecurringLinkCandidatesAction).mockResolvedValueOnce({ ok: false, error: { code: "RECURRING_TEMPLATE_NOT_FOUND", message: "Recorrência não encontrada." } });
    const { user } = renderCard();
    await user.click(screen.getByRole("button", { name: /Sem lançamento/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Recorrência não encontrada.");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    vi.mocked(listRecurringLinkCandidatesAction).mockResolvedValueOnce({ ok: true, data: { generated: [], candidates: [] } });
    await user.click(screen.getByRole("button", { name: /Sem lançamento/ }));
    expect(await screen.findByText("Nenhum lançamento compatível")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Salvar vínculos" })).toBeNull();
  });

  it("keeps the dialog open when saving fails", async () => {
    vi.mocked(listRecurringLinkCandidatesAction).mockResolvedValue({ ok: true, data: { generated: [], candidates: [candidate("PIX", {})] } });
    vi.mocked(saveRecurringLinksAction).mockResolvedValueOnce({ ok: false, error: { code: "RECURRING_LINK_INVALID", message: "Este lançamento não pode ser vinculado a esta recorrência." } });
    const { user } = renderCard();
    await user.click(screen.getByRole("button", { name: /Sem lançamento/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(await within(dialog).findByRole("checkbox", { name: /PIX/ }));
    await user.click(within(dialog).getByRole("checkbox", { name: /PIX/ }));
    await user.click(within(dialog).getByRole("button", { name: "Salvar vínculos" }));
    await waitFor(() => expect(saveRecurringLinksAction).toHaveBeenCalledWith(expect.objectContaining({ transactionIds: [], chargeIds: [] })));
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});
