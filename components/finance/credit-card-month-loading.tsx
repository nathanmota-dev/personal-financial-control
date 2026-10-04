import { LoadingBar, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
import type { CreditCardMonthLoadingProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardMonthLoading({ month }: CreditCardMonthLoadingProps) {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status" aria-live="polite">
        Carregando fatura de {formatCreditCardMonth(month)}.
      </span>
      <div aria-hidden="true" className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <LoadingPanel>
          <LoadingBar className="h-10 w-full rounded-lg" />
          <LoadingRows count={4} columns={3} />
        </LoadingPanel>
        <div className="space-y-6">
          <LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel>
          <LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel>
        </div>
      </div>
    </div>
  );
}
