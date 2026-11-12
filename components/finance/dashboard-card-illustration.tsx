import Image from "next/image";
import { cn } from "@/lib/utils";
import type { DashboardCardIllustrationProps } from "@/lib/interfaces/dashboard";

export function DashboardCardIllustration({ src, className }: DashboardCardIllustrationProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute top-2 right-5 size-[58px]", className)}>
      <div className="absolute inset-x-2 -bottom-1 h-4 rounded-[50%] bg-black/50 blur-[7px]" />
      <Image src={src} width={450} height={450} alt="" unoptimized className="relative size-full object-contain" />
    </div>
  );
}
