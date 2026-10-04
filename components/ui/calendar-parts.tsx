"use client";

import type { CalendarChevronProps,CalendarRootProps,CalendarWeekNumberProps } from "@/lib/interfaces/calendar";
import { cn } from "@/lib/utils";
import { ChevronDownIcon,ChevronLeftIcon,ChevronRightIcon } from "lucide-react";
import { createContext } from "react";
import type { Locale } from "react-day-picker";

export const CalendarLocaleContext = createContext<Partial<Locale> | undefined>(undefined);

export function CalendarRoot({ className, rootRef, ...props }: CalendarRootProps) {
  return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
}

export function CalendarChevron({ className, orientation, ...props }: CalendarChevronProps) {
  const Icon = orientation === "left" ? ChevronLeftIcon : orientation === "right" ? ChevronRightIcon : ChevronDownIcon;
  return <Icon className={cn("size-4", className)} {...props} />;
}

export function CalendarWeekNumber({ children, ...props }: CalendarWeekNumberProps) {
  return <td {...props}><div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div></td>;
}
