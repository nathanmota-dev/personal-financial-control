import type { DemoFixture } from "@/lib/demo/contracts";
import { investmentTransactions,investmentWithdrawal,rentTransactions,salaryTransactions,utilityTransactions,variableTransactions } from "./support";

export const transactions: DemoFixture["transactions"] = [
    ...salaryTransactions,
    ...rentTransactions,
    ...utilityTransactions,
    ...investmentTransactions,
    ...variableTransactions,
    investmentWithdrawal,
  ];
