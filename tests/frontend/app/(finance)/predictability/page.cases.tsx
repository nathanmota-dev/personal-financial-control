import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/predictability/page";
import PredictabilityLoading from "@/app/(finance)/predictability/loading";
import { calculatePredictability, resolveCycle } from "@/lib/predictability";
import { getPredictability } from "@/lib/server/predictability";
import { renderUI } from "@/tests/frontend/helpers";
import { navigation } from "@/tests/frontend/setup";

describe("predictability page", () => {
  it("shows what is left in the cycle, the budget breakdown and the shared month picker", async () => {
    navigation.pathname = "/predictability";
    const { user } = renderUI(await Page({ searchParams: Promise.resolve({ month: "2026-07" }) }));

    expect(screen.getByRole("heading", { name: "Previsibilidade" })).toBeVisible();
    expect(vi.mocked(getPredictability).mock.calls[0][0]).toMatchObject({ month: "2026-07" });
    const hero = screen.getByRole("region", { name: "Ainda pode gastar no ciclo" });
    expect(within(hero).getByText("Dentro do orçamento")).toBeVisible();
    expect(within(hero).getByText("Até 31/07/2026, véspera do próximo salário")).toBeVisible();
    expect(within(hero).getByText("Hoje")).toBeVisible();
    const breakdown = screen.getByRole("region", { name: "Orçamento do ciclo" });
    expect(within(breakdown).getByText("Sobra para o dia a dia")).toBeVisible();
    expect(within(breakdown).getByText("Aluguel")).toBeVisible();
    expect(within(breakdown).getByText("Fatura")).toBeVisible();
    expect(within(breakdown).getByText("Nenhum alerta neste ciclo.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "julho de 2026" }));
    await user.click(screen.getByRole("button", { name: "Ago" }));
    expect(navigation.replace).toHaveBeenCalledWith("/predictability?month=2026-08");
  });

  it("explains on the calendar which entry consumed each day", async () => {
    const { user } = renderUI(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getAllByRole("button", { name: /Consumido\. Restam/ })).toHaveLength(13);
    await user.click(screen.getByRole("button", { name: /^06\/07\/2026\. Parcial/ }));
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByText("O que consumiu este dia")).toBeVisible();
    expect(within(sheet).getByText("Tênis")).toBeVisible();
    expect(within(sheet).getByText("lançado em 01/07/2026")).toBeVisible();
    expect(within(sheet).getByText("Estorno lançado em 03/07/2026")).toBeVisible();
    expect(within(sheet).getByText("Nenhum lançamento avulso nesta data.")).toBeVisible();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: /^16\/07\/2026\. Consumido/ }));
    const todaySheet = screen.getByRole("dialog");
    expect(within(todaySheet).getByText("lançado neste dia")).toBeVisible();
    expect(within(todaySheet).getByText("Lazer · Conta principal")).toBeVisible();
  });

  it("lists every day of the cycle in the table view", async () => {
    const { user } = renderUI(await Page({ searchParams: Promise.resolve({}) }));

    await user.click(screen.getByRole("tab", { name: "Tabela" }));
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("button")).toHaveLength(31);
    expect(within(table).getByText("Total do ciclo")).toBeVisible();
    expect(screen.getByText(/^Restam/, { selector: "p" })).toBeInTheDocument();

    await user.click(within(table).getByText("03/07/2026"));
    expect(within(screen.getByRole("dialog")).getByText("Estorno")).toBeVisible();
    await user.keyboard("{Escape}");
    fireEvent.keyDown(within(table).getAllByRole("button")[23], { key: "Enter" });
    expect(within(screen.getByRole("dialog")).getAllByText("Restaurante")[0]).toBeVisible();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("tab", { name: "Calendário" }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("warns about missing income, bills above income and an overflowing cycle", async () => {
    vi.mocked(getPredictability).mockResolvedValueOnce(
      calculatePredictability({
        today: "2026-09-02",
        cycle: resolveCycle(null, "2026-07-16"),
        budgetItems: [{ id: "rent", kind: "fixed", description: "Aluguel", date: "2026-07-10", amountCents: 1000 }],
        expenses: [{ id: "x", date: "2026-07-02", description: "Mercado", amountCents: 500 }],
      })
    );
    renderUI(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Sem renda recorrente")).toBeVisible();
    expect(screen.getByText("Ciclo estourado", { selector: "p" })).toBeVisible();
    expect(screen.getByText(/Esse valor sai do próximo salário/)).toBeVisible();
    expect(screen.getByText("Fora deste ciclo")).toBeVisible();

    vi.mocked(getPredictability).mockResolvedValueOnce(
      calculatePredictability({
        today: "2026-07-02",
        cycle: resolveCycle(1, "2026-07-02"),
        budgetItems: [
          { id: "salary", kind: "income", description: "Salário", date: "2026-07-01", amountCents: 1000 },
          { id: "rent", kind: "fixed", description: "Aluguel", date: "2026-07-10", amountCents: 3000 },
        ],
        expenses: [],
      })
    );
    renderUI(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Fixos maiores que a renda")).toBeVisible();
    expect(screen.getByText("Sem orçamento")).toBeVisible();

    vi.mocked(getPredictability).mockResolvedValueOnce({
      ...calculatePredictability({ today: "2026-07-02", cycle: resolveCycle(1, "2026-07-02"), budgetItems: [], expenses: [] }),
      budgetItems: [],
    });
    renderUI(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Nenhuma renda, conta fixa ou fatura neste ciclo.")).toBeVisible();
  });

  it("ignores an invalid month and reports loading failures", async () => {
    const { unmount } = renderUI(await Page({ searchParams: Promise.resolve({ month: "julho" }) }));
    expect(vi.mocked(getPredictability).mock.calls[0][0]).toMatchObject({ month: undefined });
    unmount();

    vi.mocked(getPredictability).mockRejectedValueOnce(new Error("offline"));
    renderUI(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Não foi possível carregar a previsibilidade agora.")).toBeVisible();
  });

  it("simulates a purchase on the calendar without saving it", async () => {
    const { user } = renderUI(await Page({ searchParams: Promise.resolve({}) }));

    await user.click(screen.getByRole("button", { name: "Simular compra" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Simular" }));
    expect(within(dialog).getByText("Informe um valor maior que zero e a data da compra.")).toBeVisible();
    fireEvent.change(within(dialog).getByLabelText("Valor da compra (R$)"), { target: { value: "300,00" } });
    fireEvent.change(within(dialog).getByPlaceholderText("Compra simulada"), { target: { value: "Fone" } });
    await user.click(within(dialog).getByRole("button", { name: "Simular" }));

    const banner = screen.getByRole("region", { name: "Resultado da simulação" });
    expect(within(banner).getByText("Fone")).toBeVisible();
    expect(within(banner).getByText("Consome 7 dias, de 24/07/2026 a 30/07/2026.")).toBeVisible();
    expect(within(banner).getByText("Nenhum")).toBeVisible();
    expect(screen.getAllByLabelText(/A simulação consome/)).toHaveLength(7);
    expect(screen.getByText("Afetado pela simulação")).toBeVisible();

    await user.click(screen.getByLabelText(/^25\/07\/2026\./));
    expect(within(screen.getByRole("dialog")).getByText("simulado em 16/07/2026")).toBeVisible();
  });

  it("marks the simulated days on the table, edits and clears the simulation", async () => {
    const { user } = renderUI(await Page({ searchParams: Promise.resolve({}) }));

    await user.click(screen.getByRole("button", { name: "Simular compra" }));
    fireEvent.change(screen.getByLabelText("Valor da compra (R$)"), { target: { value: "300,00" } });
    await user.click(screen.getByRole("button", { name: "Simular" }));
    await user.click(screen.getByRole("tab", { name: "Tabela" }));
    expect(within(screen.getByRole("table")).getAllByText(/simulado$/)).toHaveLength(7);
    expect(screen.getByText("Compra simulada")).toBeVisible();

    await user.click(screen.getByText("Editar simulação"));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Valor da compra (R$)")).toHaveValue("300,00");
    fireEvent.change(within(dialog).getByLabelText("Valor da compra (R$)"), { target: { value: "2.000,00" } });
    await user.click(within(dialog).getByRole("button", { name: "Simular" }));
    expect(screen.getByText(/Esse valor sairia do próximo salário/)).toBeVisible();

    await user.click(screen.getByText("Limpar simulação"));
    expect(screen.queryByLabelText("Resultado da simulação")).not.toBeInTheDocument();
    expect(screen.getByText("Simular compra")).toBeVisible();
  });

  it("keeps a matching loading skeleton", () => {
    renderUI(<PredictabilityLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando previsibilidade.");
  });
});
