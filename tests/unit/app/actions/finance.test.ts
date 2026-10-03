import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { requireActionSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { DomainError } from "@/lib/server/errors";
import * as actions from "@/app/actions/finance";
import * as service0 from "@/lib/server/accounts";
vi.mock("@/lib/server/accounts", () => ({
  archiveAccount: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
}));
import * as service1 from "@/lib/server/categories";
vi.mock("@/lib/server/categories", () => ({
  archiveCategory: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  updateCategory: vi.fn(),
}));
import * as service2 from "@/lib/server/investments";
vi.mock("@/lib/server/investments", () => ({
  configureInvestmentPortfolio: vi.fn(),
  createInvestmentContribution: vi.fn(),
  createInvestmentWithdrawal: vi.fn(),
  reconcileInvestmentBalance: vi.fn(),
  updateInvestmentSettings: vi.fn(),
}));
import * as service3 from "@/lib/server/investment-reconciliation";
vi.mock("@/lib/server/investment-reconciliation", () => ({
  applyInvestmentReduction: vi.fn(),
  getInvestmentReductionSources: vi.fn(),
}));
import * as service4 from "@/lib/server/investment-portfolio";
vi.mock("@/lib/server/investment-portfolio", () => ({
  archiveInvestmentHolding: vi.fn(),
  archiveInvestmentPurpose: vi.fn(),
  createInvestmentHolding: vi.fn(),
  createInvestmentPurpose: vi.fn(),
  deleteInvestmentPurposeAllocation: vi.fn(),
  updateInvestmentHolding: vi.fn(),
  updateInvestmentPurpose: vi.fn(),
  upsertInvestmentPurposeAllocation: vi.fn(),
}));
import * as service5 from "@/lib/server/investment-operations";
vi.mock("@/lib/server/investment-operations", () => ({
  createOperationalInvestmentAsset: vi.fn(),
  archiveOperationalInvestmentAsset: vi.fn(),
  createInvestmentOperation: vi.fn(),
  deleteInvestmentOperation: vi.fn(),
  registerManualInvestmentQuote: vi.fn(),
  refreshInvestmentQuotes: vi.fn(),
  updateOperationalInvestmentAsset: vi.fn(),
  updateFixedIncomeTerms: vi.fn(),
  updateInvestmentOperation: vi.fn(),
  updateManualInvestmentBalance: vi.fn(),
}));
import * as service6 from "@/lib/server/recurring";
vi.mock("@/lib/server/recurring", () => ({
  createRecurringTemplate: vi.fn(),
  deleteRecurringTemplate: vi.fn(),
  generateRecurringTransactions: vi.fn(),
  pauseRecurringTemplate: vi.fn(),
  updateRecurringTemplate: vi.fn(),
}));
import * as service7 from "@/lib/server/credit-card";
vi.mock("@/lib/server/credit-card", () => ({
  createCreditCardCharge: vi.fn(),
  deleteCreditCardCharge: vi.fn(),
  updateCreditCardCharge: vi.fn(),
}));
import * as service8 from "@/lib/server/transactions";
vi.mock("@/lib/server/transactions", () => ({
  createTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}));
import * as service9 from "@/lib/server/transfers";
vi.mock("@/lib/server/transfers", () => ({ createTransfer: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ requireActionSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const payload = { id: "record-1", name: "Test", amountCents: 12345 };
const result = { id: "saved-1", amountCents: 12345 };
const cases = [
  {
    name: "createAccountAction",
    action: actions.createAccountAction,
    service: service0.createAccount,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "updateAccountAction",
    action: actions.updateAccountAction,
    service: service0.updateAccount,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "archiveAccountAction",
    action: actions.archiveAccountAction,
    service: service0.archiveAccount,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: false,
    output: "result",
  },
  {
    name: "createCategoryAction",
    action: actions.createCategoryAction,
    service: service1.createCategory,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "updateCategoryAction",
    action: actions.updateCategoryAction,
    service: service1.updateCategory,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "archiveCategoryAction",
    action: actions.archiveCategoryAction,
    service: service1.archiveCategory,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: false,
    output: "result",
  },
  {
    name: "deleteCategoryAction",
    action: actions.deleteCategoryAction,
    service: service1.deleteCategory,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: false,
    output: "undefined",
  },
  {
    name: "createTransactionAction",
    action: actions.createTransactionAction,
    service: service8.createTransaction,
    args: [payload],
    forwarded: [payload],
    wrapped: true,
    output: "result",
  },
  {
    name: "updateTransactionAction",
    action: actions.updateTransactionAction,
    service: service8.updateTransaction,
    args: [payload],
    forwarded: [payload],
    wrapped: true,
    output: "result",
  },
  {
    name: "deleteTransactionAction",
    action: actions.deleteTransactionAction,
    service: service8.deleteTransaction,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: true,
    output: "null",
  },
  {
    name: "createTransferAction",
    action: actions.createTransferAction,
    service: service9.createTransfer,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "createCreditCardChargeAction",
    action: actions.createCreditCardChargeAction,
    service: service7.createCreditCardCharge,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "updateCreditCardChargeAction",
    action: actions.updateCreditCardChargeAction,
    service: service7.updateCreditCardCharge,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "deleteCreditCardChargeAction",
    action: actions.deleteCreditCardChargeAction,
    service: service7.deleteCreditCardCharge,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: false,
    output: "undefined",
  },
  {
    name: "createRecurringTemplateAction",
    action: actions.createRecurringTemplateAction,
    service: service6.createRecurringTemplate,
    args: [payload],
    forwarded: [payload],
    wrapped: true,
    output: "result",
  },
  {
    name: "updateRecurringTemplateAction",
    action: actions.updateRecurringTemplateAction,
    service: service6.updateRecurringTemplate,
    args: [payload],
    forwarded: [payload],
    wrapped: true,
    output: "result",
  },
  {
    name: "pauseRecurringTemplateAction",
    action: actions.pauseRecurringTemplateAction,
    service: service6.pauseRecurringTemplate,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: true,
    output: "result",
  },
  {
    name: "deleteRecurringTemplateAction",
    action: actions.deleteRecurringTemplateAction,
    service: service6.deleteRecurringTemplate,
    args: ["record-1", "only_template"],
    forwarded: ["record-1", "only_template"],
    wrapped: true,
    output: "null",
  },
  {
    name: "generateRecurringTransactionsAction",
    action: actions.generateRecurringTransactionsAction,
    service: service6.generateRecurringTransactions,
    args: ["2026-07"],
    forwarded: ["2026-07"],
    wrapped: true,
    output: "result",
  },
  {
    name: "configureInvestmentPortfolioAction",
    action: actions.configureInvestmentPortfolioAction,
    service: service2.configureInvestmentPortfolio,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "updateInvestmentSettingsAction",
    action: actions.updateInvestmentSettingsAction,
    service: service2.updateInvestmentSettings,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "reconcileInvestmentBalanceAction",
    action: actions.reconcileInvestmentBalanceAction,
    service: service2.reconcileInvestmentBalance,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "getInvestmentReductionSourcesAction",
    action: actions.getInvestmentReductionSourcesAction,
    service: service3.getInvestmentReductionSources,
    args: [payload],
    forwarded: [undefined, payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "applyInvestmentReductionAction",
    action: actions.applyInvestmentReductionAction,
    service: service3.applyInvestmentReduction,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "createInvestmentContributionAction",
    action: actions.createInvestmentContributionAction,
    service: service2.createInvestmentContribution,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "createInvestmentWithdrawalAction",
    action: actions.createInvestmentWithdrawalAction,
    service: service2.createInvestmentWithdrawal,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "createInvestmentHoldingAction",
    action: actions.createInvestmentHoldingAction,
    service: service4.createInvestmentHolding,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "updateInvestmentHoldingAction",
    action: actions.updateInvestmentHoldingAction,
    service: service4.updateInvestmentHolding,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "archiveInvestmentHoldingAction",
    action: actions.archiveInvestmentHoldingAction,
    service: service4.archiveInvestmentHolding,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: false,
    output: "result",
  },
  {
    name: "createInvestmentPurposeAction",
    action: actions.createInvestmentPurposeAction,
    service: service4.createInvestmentPurpose,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "updateInvestmentPurposeAction",
    action: actions.updateInvestmentPurposeAction,
    service: service4.updateInvestmentPurpose,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "archiveInvestmentPurposeAction",
    action: actions.archiveInvestmentPurposeAction,
    service: service4.archiveInvestmentPurpose,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: false,
    output: "result",
  },
  {
    name: "upsertInvestmentPurposeAllocationAction",
    action: actions.upsertInvestmentPurposeAllocationAction,
    service: service4.upsertInvestmentPurposeAllocation,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "deleteInvestmentPurposeAllocationAction",
    action: actions.deleteInvestmentPurposeAllocationAction,
    service: service4.deleteInvestmentPurposeAllocation,
    args: [payload],
    forwarded: [payload],
    wrapped: false,
    output: "result",
  },
  {
    name: "createOperationalInvestmentAssetAction",
    action: actions.createOperationalInvestmentAssetAction,
    service: service5.createOperationalInvestmentAsset,
    args: [payload],
    forwarded: [payload],
    wrapped: true,
    output: "result",
  },
  {
    name: "createInvestmentOperationAction",
    action: actions.createInvestmentOperationAction,
    service: service5.createInvestmentOperation,
    args: [payload],
    forwarded: [payload],
    wrapped: true,
    output: "result",
  },
  {
    name: "updateInvestmentOperationAction",
    action: actions.updateInvestmentOperationAction,
    service: service5.updateInvestmentOperation,
    args: ["record-1", payload],
    forwarded: ["record-1", payload],
    wrapped: true,
    output: "result",
  },
  {
    name: "deleteInvestmentOperationAction",
    action: actions.deleteInvestmentOperationAction,
    service: service5.deleteInvestmentOperation,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: true,
    output: "null",
  },
  {
    name: "registerManualInvestmentQuoteAction",
    action: actions.registerManualInvestmentQuoteAction,
    service: service5.registerManualInvestmentQuote,
    args: [payload],
    forwarded: [payload],
    wrapped: true,
    output: "result",
  },
  {
    name: "updateManualInvestmentBalanceAction",
    action: actions.updateManualInvestmentBalanceAction,
    service: service5.updateManualInvestmentBalance,
    args: [payload],
    forwarded: [payload],
    wrapped: true,
    output: "null",
  },
  {
    name: "updateFixedIncomeTermsAction",
    action: actions.updateFixedIncomeTermsAction,
    service: service5.updateFixedIncomeTerms,
    args: [payload],
    forwarded: [payload],
    wrapped: true,
    output: "null",
  },
  {
    name: "refreshInvestmentQuotesAction",
    action: actions.refreshInvestmentQuotesAction,
    service: service5.refreshInvestmentQuotes,
    args: [],
    forwarded: [],
    wrapped: true,
    output: "result",
  },
  {
    name: "updateOperationalInvestmentAssetAction",
    action: actions.updateOperationalInvestmentAssetAction,
    service: service5.updateOperationalInvestmentAsset,
    args: ["record-1", payload],
    forwarded: ["record-1", payload],
    wrapped: true,
    output: "result",
  },
  {
    name: "archiveOperationalInvestmentAssetAction",
    action: actions.archiveOperationalInvestmentAssetAction,
    service: service5.archiveOperationalInvestmentAsset,
    args: ["record-1"],
    forwarded: ["record-1"],
    wrapped: true,
    output: "null",
  },
] as const;
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireActionSession).mockResolvedValue({ uid: "user" } as never);
});
describe("finance action boundary", () => {
  for (const entry of cases) {
    it(`${entry.name} authorizes, forwards arguments, returns its contract and revalidates`, async () => {
      vi.mocked(entry.service).mockResolvedValue(result as never);
      const action = entry.action as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>;
      const actual = await action(...entry.args);
      expect(requireActionSession).toHaveBeenCalledOnce();
      expect(entry.service).toHaveBeenCalledWith(...entry.forwarded);
      expect(
        vi.mocked(requireActionSession).mock.invocationCallOrder[0],
      ).toBeLessThan(vi.mocked(entry.service).mock.invocationCallOrder[0]);
      const data =
        entry.output === "null"
          ? null
          : entry.output === "undefined"
            ? undefined
            : result;
      expect(actual).toEqual(entry.wrapped ? { ok: true, data } : data);
      if (entry.name === "getInvestmentReductionSourcesAction")
        expect(revalidatePath).not.toHaveBeenCalled();
      else
        expect(
          vi.mocked(revalidatePath).mock.calls.map(([path]) => path),
        ).toEqual([
          "/",
          "/dashboard",
          "/transactions",
          "/recurring",
          "/projected-balance",
          "/investments",
          "/investments/portfolio",
          "/investments/emergency-reserve",
          "/goals",
          "/credit-card",
        ]);
    });
    it(`${entry.name} stops unauthorized mutations before service calls`, async () => {
      vi.mocked(requireActionSession).mockRejectedValue(
        new Error("unauthorized"),
      );
      const action = entry.action as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>;
      await expect(action(...entry.args)).rejects.toThrow("unauthorized");
      expect(entry.service).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });
    it(`${entry.name} preserves failures without revalidating`, async () => {
      const failure = new DomainError("NO_BALANCE", "Saldo insuficiente", 409);
      vi.mocked(entry.service).mockRejectedValue(failure);
      const action = entry.action as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>;
      if (entry.wrapped)
        await expect(action(...entry.args)).resolves.toEqual({
          ok: false,
          error: { code: "NO_BALANCE", message: "Saldo insuficiente" },
        });
      else await expect(action(...entry.args)).rejects.toBe(failure);
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  }
  it.each(["name", "description", "amountCents", "other", 0])(
    "maps validation fields %s",
    async (field) => {
      const service = cases.find(
        (entry) => entry.name === "createTransactionAction",
      )!.service;
      vi.mocked(service).mockRejectedValue(
        new ZodError([{ code: "custom", path: [field], message: "invalid" }]),
      );
      const actual = await actions.createTransactionAction(payload as never);
      expect(actual).toMatchObject({
        ok: false,
        error:
          field === "name" || field === "description"
            ? { code: "INVALID_NAME", field: "name" }
            : field === "amountCents"
              ? { code: "INVALID_AMOUNT", field }
              : {
                  code: "VALIDATION_ERROR",
                  message: "invalid",
                  field: typeof field === "string" ? field : undefined,
                },
      });
    },
  );
  it("handles empty validation issues and unexpected failures", async () => {
    const service = cases.find(
      (entry) => entry.name === "createTransactionAction",
    )!.service;
    vi.mocked(service)
      .mockRejectedValueOnce(new ZodError([]))
      .mockRejectedValueOnce("unexpected");
    await expect(
      actions.createTransactionAction(payload as never),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Confira os dados informados.",
      },
    });
    await expect(
      actions.createTransactionAction(payload as never),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "FINANCE_ACTION_FAILED",
        message: "Não foi possível concluir esta operação.",
      },
    });
  });
});
