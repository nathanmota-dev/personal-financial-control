import type { ReactNode } from "react";

export type Tone =
  | "brand"
  | "success"
  | "danger"
  | "warning"
  | "violet"
  | "neutral"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8";

export type IconTileProps = {
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
};

export type ToneChipProps = {
  tone?: Tone;
  icon?: ReactNode;
  dot?: boolean;
  children: ReactNode;
  className?: string;
};

export type CategoryChipProps = {
  name?: string | null;
  className?: string;
};

export type HeroPanelProps = {
  eyebrow: string;
  value: ReactNode;
  caption?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export type HeroStatProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
};

export type MeterProps = {
  value: number;
  tone?: Tone;
  striped?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export type RingProgressProps = {
  value: number;
  tone?: Tone;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
};

export type SectionCardProps = {
  title: string;
  description?: ReactNode;
  count?: number;
  icon?: ReactNode;
  tone?: Tone;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export type DateGroupLabelProps = {
  date: string;
  total?: ReactNode;
};
