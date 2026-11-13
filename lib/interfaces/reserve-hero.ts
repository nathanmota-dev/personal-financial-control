import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ReserveHeroStat = { label: string; value: ReactNode; hint: string; icon: LucideIcon };

export type ReserveHeroContent = { title: string; description: string; stats: ReserveHeroStat[] };

export type ReserveHeroFormat = (cents: number) => ReactNode;
