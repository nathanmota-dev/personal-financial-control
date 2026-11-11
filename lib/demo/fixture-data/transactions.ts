import type { DemoFixture } from "@/lib/demo/contracts";
import { investmentTransactions,investmentWithdrawal,rentTransactions,salaryTransactions,upcomingBillTransactions,utilityTransactions,variableTransactions } from "./support";

export const transactions: DemoFixture["transactions"] = [
    ...salaryTransactions,
    ...rentTransactions,
    ...utilityTransactions,
    ...upcomingBillTransactions,
    ...investmentTransactions,
    ...variableTransactions,
    investmentWithdrawal,
  ];
