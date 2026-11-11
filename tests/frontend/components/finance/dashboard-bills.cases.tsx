import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { markRecurringExpensePaidAction } from "@/app/actions/finance";
import { DashboardBills } from "@/components/finance/dashboard-bills";
import { buildDashboardBills, daysLeftInMonth, describeBillsDistance, groupBillsByDay, summarizeDashboardBills } from "@/lib/dashboard-bills";
import { renderUI } from "@/tests/frontend/helpers";

const template = (id: string, dayOfMonth: number, amountCents: number, extra = {}) => ({ id, description: `Conta ${id}`, amountCents, dayOfMonth, startMonth: "2026-01", ...extra });

const data = (today: string, templates: ReturnType<typeof template>[], paid: string[] = []) => summarizeDashboardBills({ today, templates, paidTemplateIds: new Set(paid) });

describe("dashboard bills", () => {
  it("keeps unpaid bills due after today until the end of the month, soonest first", () => {
    const bills = buildDashboardBills({
      today: "2026-11-11",
      templates: [template("a", 30, 100), template("b", 5, 200), template("c", 11, 300), template("d", 20, 400, { endMonth: "2026-10" }), template("e", 15, 500), template("f", 31, 600)],
      paidTemplateIds: new Set(["e"]),
    });
    expect(bills.map((bill) => [bill.id, bill.dueDate])).toEqual([["f", "2026-11-30"], ["a", "2026-11-30"]]);
    expect(groupBillsByDay(bills).map((day) => [day.day, day.bills.length])).toEqual([[30, 2]]);
  });
  it("describes the distance", () => {
    expect([0, 1, 25].map(describeBillsDistance)).toEqual(["hoje", "amanhã", "em 25 dias"]);
  });
  it("counts the days left in the month", () => {
    expect([daysLeftInMonth("2026-11-10"), daysLeftInMonth("2026-11-30"), daysLeftInMonth("2026-02-01")]).toEqual([20, 0, 27]);
  });
  it("shows days left, paid count and switches the listed day", async () => {
    const { user } = renderUI(<DashboardBills data={data("2026-11-11", [template("a", 12, 150000), template("b", 20, 33000), template("c", 5, 100), template("d", 25, 100)], ["d"])} />);
    expect(screen.getByText("• dia 12")).toBeVisible();
    expect(screen.getByText("em 19 dias · 2 de 4 pagas")).toBeVisible();
    expect(screen.getByText("Conta a")).toBeVisible();
    await user.click(screen.getAllByTestId("bills-day-tab")[1]);
    expect(screen.getByText("• dia 20")).toBeVisible();
    expect(screen.getByText("Conta b")).toBeVisible();
  });
  it("marks a bill as paid, making it leave the list at once", async () => {
    vi.mocked(markRecurringExpensePaidAction).mockResolvedValue({ ok: true, data: null } as never);
    const { user } = renderUI(<DashboardBills data={data("2026-11-11", [template("a", 12, 150000), template("b", 20, 33000)])} />);
    await user.click(screen.getByRole("checkbox", { name: "Marcar Conta a como paga" }));
    expect(markRecurringExpensePaidAction).toHaveBeenCalledWith("a", "2026-11");
    expect(screen.queryByText("Conta a")).toBeNull();
    expect(screen.getByText("em 19 dias · 1 de 2 pagas")).toBeVisible();
  });
  it("shows an empty state without bills", () => {
    renderUI(<DashboardBills data={data("2026-11-11", [])} />);
    expect(screen.getByText("Nenhuma conta a pagar")).toBeVisible();
  });
});

describe("dashboard bills day paging", () => {
  const many = buildDashboardBills({ today: "2026-11-01", templates: Array.from({ length: 7 }, (_, index) => template(`t${index}`, index + 2, 100)), paidTemplateIds: new Set() });
  it("shows five days and pages with arrows only when there are more", async () => {
    const { user } = renderUI(<DashboardBills data={{ ...data("2026-11-01", []), bills: many }} />);
    expect(screen.getAllByTestId("bills-day-tab")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "Dias anteriores" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Próximos dias" }));
    await user.click(screen.getByRole("button", { name: "Dias anteriores" }));
    expect(screen.getAllByTestId("bills-day-tab")).toHaveLength(5);
  });
  it("hides the arrows with five days or fewer", () => {
    renderUI(<DashboardBills data={{ ...data("2026-11-01", []), bills: many.slice(0, 5) }} />);
    expect(screen.queryByRole("button", { name: "Próximos dias" })).toBeNull();
  });
});
