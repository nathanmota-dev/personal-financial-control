import type { FinanceRouteSkeletonEntry } from "@/lib/interfaces/loading";
import { AccountSkeleton } from "./account-skeleton";
import { AssetSkeleton } from "./asset-skeleton";
import { BudgetsSkeleton } from "./budgets-skeleton";
import { CalculatorsSkeleton } from "./calculators-skeleton";
import { CompoundInterestSkeleton } from "./compound-interest-skeleton";
import { CreditCardSkeleton } from "./credit-card-skeleton";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { GoalsSkeleton } from "./goals-skeleton";
import { HousingSkeleton } from "./housing-skeleton";
import { InvestmentsSkeleton } from "./investments-skeleton";
import { PortfolioSkeleton } from "./portfolio-skeleton";
import { ProjectedBalanceSkeleton } from "./projected-balance-skeleton";
import { RecurringSkeleton } from "./recurring-skeleton";
import { ReportsSkeleton } from "./reports-skeleton";
import { ReserveSkeleton } from "./reserve-skeleton";
import { SettingsSkeleton } from "./settings-skeleton";
import { TransactionsSkeleton } from "./transactions-skeleton";

/** Same skeletons as each route's `loading.tsx`; the longest matching prefix wins. */
export const FINANCE_ROUTE_SKELETONS: FinanceRouteSkeletonEntry[] = [
  { prefix: "/dashboard", Skeleton: DashboardSkeleton },
  { prefix: "/housing", Skeleton: HousingSkeleton },
  { prefix: "/credit-card", Skeleton: CreditCardSkeleton },
  { prefix: "/transactions", Skeleton: TransactionsSkeleton },
  { prefix: "/budgets", Skeleton: BudgetsSkeleton },
  { prefix: "/recurring", Skeleton: RecurringSkeleton },
  { prefix: "/projected-balance", Skeleton: ProjectedBalanceSkeleton },
  { prefix: "/investments", Skeleton: InvestmentsSkeleton },
  { prefix: "/investments/portfolio", Skeleton: PortfolioSkeleton },
  { prefix: "/investments/assets", Skeleton: AssetSkeleton },
  { prefix: "/reserve", Skeleton: ReserveSkeleton },
  { prefix: "/reports", Skeleton: ReportsSkeleton },
  { prefix: "/goals", Skeleton: GoalsSkeleton },
  { prefix: "/calculators", Skeleton: CalculatorsSkeleton },
  { prefix: "/calculators/compound-interest", Skeleton: CompoundInterestSkeleton },
  { prefix: "/calculators/net-salary", Skeleton: CompoundInterestSkeleton },
  { prefix: "/calculators/pj-income", Skeleton: CompoundInterestSkeleton },
  { prefix: "/settings", Skeleton: SettingsSkeleton },
  { prefix: "/account", Skeleton: AccountSkeleton },
];
