import type { DateGroupLabelProps } from "@/lib/interfaces/design-system";

const formatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "long", timeZone: "UTC" });

export function formatDateGroup(date: string) {
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : formatter.format(parsed).replace(".", "");
}

export function DateGroupLabel({ date, total }: DateGroupLabelProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px] font-semibold tracking-[0.08em] text-content-muted uppercase">
      <span>{formatDateGroup(date)}</span>
      {total && <span className="tracking-normal normal-case tabular-nums">{total}</span>}
    </div>
  );
}
