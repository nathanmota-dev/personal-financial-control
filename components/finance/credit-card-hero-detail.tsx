import type { CreditCardHeroDetailProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardHeroDetail({ label, value, detail }: CreditCardHeroDetailProps) {
  return (
    <div className="rounded-2xl border border-input/70 bg-muted/30 px-4 py-3.5">
      <p className="text-xs font-medium text-content">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand">{value}</p>
      <p className="mt-1 text-xs text-content">{detail}</p>
    </div>
  );
}
