import type { Button } from "@/components/ui/button";
import type React from "react";
import type { CustomComponents,DayButton,DayPicker,Locale } from "react-day-picker";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};
export type CalendarDayButtonProps = React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> };
export type CalendarStyleOptions = Pick<CalendarProps, "buttonVariant" | "captionLayout" | "showWeekNumber" | "classNames">;
export type CalendarRootProps = React.ComponentProps<CustomComponents["Root"]>;
export type CalendarChevronProps = React.ComponentProps<CustomComponents["Chevron"]>;
export type CalendarWeekNumberProps = React.ComponentProps<CustomComponents["WeekNumber"]>;
