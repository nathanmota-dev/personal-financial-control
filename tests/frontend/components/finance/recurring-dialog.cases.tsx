import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createRecurringTemplateAction } from "@/app/actions/finance";
import { RecurringAgenda } from "@/components/finance/recurring-agenda";
import { RecurringCard } from "@/components/finance/recurring-card";
import { RecurringDialog } from "@/components/finance/recurring-dialog";
import { emptyRecurringOccurrences } from "@/lib/recurring-status";
import fixtures from "../../fixtures/finance.json";
import { freezeFinanceDate, renderUI } from "../../helpers";

const accounts = fixtures.accounts as never;
const categories = fixtures.categories as never;
const rent = fixtures.recurring.find((template) => template.description === "Aluguel")!;

describe("recurring day of month", () => {
  it("picks the day from a grid and previews the months it moves to the last day", async () => {
    freezeFinanceDate();
    const { user } = renderUI(<RecurringDialog accounts={accounts} categories={categories} month="2026-07" />);
    await user.click(screen.getByRole("button", { name: "Nova recorrência" }));
    const dialog = screen.getByRole("dialog", { name: "Nova recorrência" });
    const dayField = within(dialog).getByRole("button", { name: "Dia do lançamento" });
    expect(dayField).toHaveTextContent("Dia 5");
    expect(within(dialog).getByText("Todo mês no dia 5.")).toBeVisible();

    await user.click(dayField);
    await user.click(screen.getByRole("button", { name: "Dia 31" }));
    expect(dayField).toHaveTextContent("Dia 31");
    const adjustments = within(dialog).getByRole("list", { name: "Próximos ajustes de data" });
    expect(within(adjustments).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "30/09/2026",
      "30/11/2026",
      "28/02/2027",
      "30/04/2027",
      "30/06/2027",
    ]);

    await user.type(within(dialog).getByRole("textbox", { name: "Nome da recorrência" }), "Condomínio");
    await user.type(within(dialog).getByRole("textbox", { name: /Valor/ }), "45000");
    await user.click(within(dialog).getByRole("button", { name: "Criar recorrência" }));
    await waitFor(() =>
      expect(createRecurringTemplateAction).toHaveBeenCalledWith(expect.objectContaining({ name: "Condomínio", dayOfMonth: 31 })),
    );
  });

  it("starts the edit form on the saved day", async () => {
    const { user } = renderUI(
      <RecurringDialog accounts={accounts} categories={categories} month="2026-07" template={rent as never} trigger={<button type="button">Editar aluguel</button>} />,
    );
    await user.click(screen.getByRole("button", { name: "Editar aluguel" }));
    expect(screen.getByRole("button", { name: "Dia do lançamento" })).toHaveTextContent("Dia 8");
  });

  it("shows the day a recurrence falls on in a shorter month", () => {
    renderUI(
      <ul>
        <RecurringCard template={{ ...rent, dayOfMonth: 31 } as never} accounts={accounts} categories={categories} month="2027-02" occurrences={emptyRecurringOccurrences("2027-02")} />
      </ul>,
    );
    expect(screen.getByTitle("Dia 31, no último dia deste mês")).toHaveTextContent("28");
  });

  it("shows the agenda on the day each recurrence falls on", () => {
    renderUI(<RecurringAgenda month="2026-11" occurrences={emptyRecurringOccurrences("2026-11")} templates={[{ ...rent, dayOfMonth: 31 }] as never} />);
    expect(screen.getByText("Aluguel").closest("li")).toHaveTextContent(/^30Aluguel/);
  });
});
