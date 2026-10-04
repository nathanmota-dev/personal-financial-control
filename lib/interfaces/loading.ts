import type { ReactNode } from "react";

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
