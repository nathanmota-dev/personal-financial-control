import type { ComponentType, ReactNode } from "react";

export interface LoadingPageProps {
  label: string;
  actions?: number;
  className?: string;
  children?: ReactNode;
}

export interface LoadingBlockProps {
  className?: string;
  children?: ReactNode;
}

export interface LoadingRepeatProps {
  count: number;
  className?: string;
}

export interface LoadingRowsProps extends LoadingRepeatProps {
  columns?: number;
}

/** A route prefix and the skeleton shown while that route loads. */
export interface FinanceRouteSkeletonEntry {
  prefix: string;
  Skeleton: ComponentType;
}
