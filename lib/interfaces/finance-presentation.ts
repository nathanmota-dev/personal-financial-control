import type { ReactNode } from "react";

export type FinanceMetricProps = {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "violet";
  className?: string;
};

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export type FinanceEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export type ErrorPanelProps = {
  title: string;
  message: string;
};

export type RouteStatusProps = {
  /** Path of the large 3D illustration above the code. */
  illustrationSrc: string;
  /** Big status shown under the illustration, such as "404". */
  code: string;
  title: string;
  description: string;
  details?: ReactNode;
  actions: ReactNode;
  /** Fills the viewport, for screens rendered outside the app shell. */
  fullScreen?: boolean;
};

export type NotFoundStatusProps = {
  fullScreen?: boolean;
};

/** Props Next passes to an `error.tsx` boundary. */
export type RouteErrorProps = {
  error: unknown;
  retry: () => void;
};
