import { FinanceMetric } from "@/components/finance/finance-metric";
import type { CreditCardHeroDetailProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardHeroDetail({ label, value, detail, icon, tone }: CreditCardHeroDetailProps) {
  return <FinanceMetric label={label} value={value} description={detail} icon={icon} tone={tone} className="h-full" />;
}
