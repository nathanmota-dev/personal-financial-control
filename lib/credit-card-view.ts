import type {
  CreditCardMonthPoint,
  ReadyCreditCardOverview,
} from "@/lib/interfaces/credit-card-view";
import { getDefaultMonth } from "@/lib/finance-ui";

function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));

  return `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function buildCreditCardMonthPoints(overview: ReadyCreditCardOverview) {
  const timeline = new Map(
    overview.timeline.map((point) => [point.month, {
      month: point.month,
      totalCents: point.totalAmountCents,
      entryCount: point.purchaseCount,
      billStatus: point.billStatus,
    }])
  );
  const selectedPoint: CreditCardMonthPoint = {
    month: overview.month,
    totalCents: overview.invoice.totalAmountCents,
    entryCount: overview.invoice.purchaseCount,
    billStatus: overview.invoice.bill?.status ?? null,
  };

  timeline.set(overview.month, selectedPoint);

  const anchorMonth = getDefaultMonth();
  let startMonth = shiftMonth(anchorMonth, -18);
  let endMonth = shiftMonth(anchorMonth, 29);

  if (overview.month < startMonth) {
    startMonth = shiftMonth(overview.month, -12);
  }

  if (overview.month > endMonth) {
    endMonth = shiftMonth(overview.month, 12);
  }

  const points: CreditCardMonthPoint[] = [];
  let month = startMonth;

  while (month <= endMonth) {
    points.push(
      timeline.get(month) ?? {
        month,
        totalCents: 0,
        entryCount: 0,
        billStatus: null,
      }
    );
    month = shiftMonth(month, 1);
  }

  return points;
}

export function formatCreditCardMonth(month: string) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));

  return label.replace(/^./, (character) => character.toUpperCase());
}
