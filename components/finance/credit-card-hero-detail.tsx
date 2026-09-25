import type { CreditCardHeroDetailProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardHeroDetail({ label, value, detail }: CreditCardHeroDetailProps) {
  return (
    <div className="rounded-2xl border border-input/70 bg-surface/35 px-4 py-3.5">
      <p className="text-xs uppercase tracking-[0.16em] text-content-strong0">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-brand">{value}</p>
      <p className="mt-1 text-xs text-content-strong0">{detail}</p>
    </div>
  );
}
