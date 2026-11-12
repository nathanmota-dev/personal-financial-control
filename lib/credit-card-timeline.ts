import type {
CreditCardMonthPoint,
CreditCardTimelineNode,
} from "@/lib/interfaces/credit-card-view";

// The line lives in the band between the month label and the value inside each tile.
const BAND_TOP = 36;
const BAND_BOTTOM = 62;

/**
 * Places each month on the line (percent of the strip) and tones its value against the previous month:
 * a bigger invoice is bad (danger), a smaller one is good (success). Months after `currentMonth` are projections.
 */
export function buildCreditCardTimeline(
  points: CreditCardMonthPoint[],
  previousTotalCents: number | undefined,
  currentMonth: string,
): CreditCardTimelineNode[] {
  const totals = points.map((point) => point.totalCents);
  const min = Math.min(...totals);
  const span = Math.max(...totals) - min;

  return points.map((point, index) => {
    const previous = index === 0 ? previousTotalCents : points[index - 1].totalCents;
    const projected = point.month > currentMonth;
    const tone = projected || previous === undefined || point.totalCents === previous
      ? "neutral"
      : point.totalCents > previous ? "danger" : "success";
    const level = span === 0 ? 0.5 : (point.totalCents - min) / span;

    return {
      point,
      projected,
      tone,
      x: ((index + 0.5) / points.length) * 100,
      y: BAND_BOTTOM - level * (BAND_BOTTOM - BAND_TOP),
    };
  });
}

/** Splits the line into the solid part (up to the last real month) and the dashed projection. */
export function buildCreditCardTimelinePaths(nodes: CreditCardTimelineNode[]) {
  const lastActual = nodes.reduce((last, node, index) => (node.projected ? last : index), -1);
  const toPath = (items: CreditCardTimelineNode[]) =>
    items.length > 1 ? items.map((node, index) => `${index ? "L" : "M"}${node.x},${node.y}`).join(" ") : "";

  return {
    solid: toPath(nodes.slice(0, lastActual + 1)),
    dashed: toPath(nodes.slice(Math.max(lastActual, 0))),
  };
}
