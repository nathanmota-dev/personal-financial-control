import { TooltipNameType } from "@/components/ui/chart/context";
import * as React from "react";
import type { TooltipValueType } from "recharts";
import * as RechartsPrimitive from "recharts";

export interface ChartTooltipContentDiv1Props {
  className: string | undefined;
  nestLabel: boolean;
  tooltipLabel: import("react/jsx-runtime").JSX.Element | null;
  payload: readonly RechartsPrimitive.TooltipPayloadEntry<TooltipValueType, TooltipNameType>[];
  nameKey: string | undefined;
  config: import("@/components/ui/chart").ChartConfig;
  color: string | undefined;
  indicator: "line" | "dot" | "dashed";
  formatter: (import("recharts/types/component/DefaultTooltipContent").Formatter<TooltipValueType, import("recharts/types/component/DefaultTooltipContent").NameType> & ((value: TooltipValueType, name: import("recharts/types/component/DefaultTooltipContent").NameType, item: import("recharts/types/state/tooltipSlice").TooltipPayloadEntry, index: number, payload: RechartsPrimitive.TooltipPayload) => React.ReactNode | [React.ReactNode, React.ReactNode]) & import("recharts/types/component/DefaultTooltipContent").Formatter<TooltipValueType, TooltipNameType>) | undefined;
  hideIndicator: boolean;
}
