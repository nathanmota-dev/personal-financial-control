export type CreditCardCategoryOption = {
  id: string;
  name: string;
  group: "income" | "fixed_expense" | "variable_expense" | "investment";
};

export type CreditCardChargeForEdit = {
  id: string;
  accountId: string;
  categoryId: string;
  description: string;
  notes?: string | null;
  purchaseDate: string;
  totalAmountCents: number;
  installmentCount: number;
  kind?: "purchase" | "adjustment";
};

export type CreditCardOverview =
  | {
      state: "no_account";
      month: string;
    }
  | {
      state: "multiple_accounts";
      month: string;
      accounts: Array<{
        id: string;
        name: string;
        creditClosingDay: number | null;
        creditDueDay: number;
      }>;
    }
  | {
      state: "ready";
      month: string;
      needsConfiguration: boolean;
      account: {
        id: string;
        name: string;
        type: "checking" | "savings" | "cash" | "credit" | "investment";
        initialBalanceCents: number;
        creditClosingDay: number | null;
        creditDueDay: number;
      };
      timeline: Array<{
        month: string;
        totalAmountCents: number;
        purchaseCount: number;
        billStatus: "open" | "paid" | null;
      }>;
      budgetSummary: {
        incomeCents: number;
        nonCardExpenseCents: number;
        investmentContributionCents: number;
        investmentWithdrawalCents: number;
        availableForInvoiceCents: number;
        invoiceTotalCents: number;
        remainingAfterInvoiceCents: number;
      };
      invoice: {
        totalAmountCents: number;
        calculatedTotalAmountCents: number;
        ignoredAmountCents: number;
        purchaseCount: number;
        bill: {
          id: string;
          status: "open" | "paid";
          dueDate: string;
          statementTotalCents: number;
          currentChargesTotalCents: number;
          priorBalanceCents: number;
          preStatementPaymentsCents: number;
          ignoredAmountCents: number;
          paidAt: string | null;
        } | null;
        entries: Array<{
          id: string;
          chargeId?: string;
          source: "installment" | "legacy_transaction";
          amountCents: number;
          totalAmountCents?: number;
          kind?: "purchase" | "adjustment";
          description: string;
          expenseDate: string;
          purchaseDate: string;
          notes?: string | null;
          installmentNumber?: number;
          installmentCount?: number;
          category: {
            id: string;
            name: string;
            group: string;
          } | null;
        }>;
        categoryTotals: Array<{
          categoryId: string;
          categoryName: string;
          amountCents: number;
          group: string;
        }>;
        futureInstallments: Array<{
          id: string;
          description: string;
          purchaseDate: string;
          totalAmountCents: number;
          installmentCount: number;
          kind?: "purchase" | "adjustment";
          categoryId: string;
          notes?: string | null;
          remainingAmountCents: number;
          category: {
            id: string;
            name: string;
            group: string;
          } | null;
          installments: Array<{
            id: string;
            installmentNumber: number;
            amountCents: number;
            invoiceMonth: string;
          }>;
        }>;
      };
    };
