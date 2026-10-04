
export const filterInputClassName =
  "h-10 rounded-xl border-input bg-card text-sm text-content-strong shadow-none focus-visible:border-brand/70 focus-visible:ring-brand/20";

export const filterSelectTriggerClassName =
  "h-10 w-full rounded-xl border-input bg-card pr-11 pl-4 text-left text-sm text-content-strong shadow-none hover:bg-card focus-visible:border-brand/70 focus-visible:ring-brand/20 data-[state=open]:border-content-subtle data-[state=open]:bg-surface-raised";

export const filterSelectContentClassName =
  "rounded-xl border-border bg-card p-1 text-content-strong shadow-none";

export const filterSelectItemClassName =
  "min-h-10 rounded-lg px-3 py-2 text-sm text-content-strong focus:bg-surface-elevated focus:text-content-strong data-[state=checked]:bg-surface-elevated/90 data-[state=checked]:text-content-strong";

export function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
