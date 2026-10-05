import { beforeEach, expect, it, vi } from "vitest";
import { requireActionSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import * as service from "@/lib/server/budgets";
import { saveBudgetAction, removeBudgetAction, copyPreviousBudgetsAction } from "@/app/actions/finance/budgets";
vi.mock("@/lib/auth/server", () => ({ requireActionSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/server/budgets", () => ({ saveBudget: vi.fn(), removeBudget: vi.fn(), copyPreviousBudgets: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); });
const input = { categoryId: "category", competenceMonth: "2026-07", amountCents: 80000 };
it("authenticates mutations and refreshes budgets", async () => {
  expect(await saveBudgetAction(input)).toEqual({ ok: true, data: null });
  expect(service.saveBudget).toHaveBeenCalledWith(input);
  expect(requireActionSession).toHaveBeenCalled();
  expect(revalidatePath).toHaveBeenCalledWith("/budgets");
  expect(await removeBudgetAction(input)).toEqual({ ok: true, data: null });
  vi.mocked(service.copyPreviousBudgets).mockResolvedValue(2);
  expect(await copyPreviousBudgetsAction("2026-07")).toEqual({ ok: true, data: 2 });
});
it("prevents unauthorized writes and returns mutation errors", async () => {
  vi.mocked(requireActionSession).mockRejectedValueOnce(new Error("Unauthorized"));
  await expect(saveBudgetAction(input)).rejects.toThrow("Unauthorized");
  expect(service.saveBudget).not.toHaveBeenCalled();
  vi.mocked(service.saveBudget).mockRejectedValueOnce(new Error("failure"));
  expect(await saveBudgetAction(input)).toMatchObject({ ok: false });
});
