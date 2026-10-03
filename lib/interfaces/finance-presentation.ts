import type { ReactNode } from "react";

export type FinanceMetricProps = {
  label: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
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
