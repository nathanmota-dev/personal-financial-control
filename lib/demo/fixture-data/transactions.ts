import type { DemoFixture } from "@/lib/demo/contracts";
import { housingExtraTransactions,investmentTransactions,investmentWithdrawal,rentTransactions,salaryTransactions,upcomingBillTransactions,utilityTransactions,variableTransactions } from "./support";

export const transactions: DemoFixture["transactions"] = [
    ...salaryTransactions,
    ...rentTransactions,
    ...housingExtraTransactions,
    ...utilityTransactions,
    ...upcomingBillTransactions,
    ...investmentTransactions,
    ...variableTransactions,
    investmentWithdrawal,
  ];
