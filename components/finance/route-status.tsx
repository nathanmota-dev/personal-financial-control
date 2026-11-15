import Image from "next/image";

import type { RouteStatusProps } from "@/lib/interfaces/finance-presentation";
import { cn } from "@/lib/utils";

/** Centered status screen (404, route error): large illustration, big code, text and actions. */
export function RouteStatus({ illustrationSrc, code, title, description, details, actions, fullScreen = false }: RouteStatusProps) {
  return (
    <section aria-labelledby="route-status-title" className={cn("flex flex-col items-center justify-center px-4 py-12 text-center", fullScreen ? "min-h-svh" : "min-h-[calc(100svh-14rem)]")}>
      <div aria-hidden className="pointer-events-none relative size-[160px] sm:size-[200px]">
        <div className="absolute inset-x-6 -bottom-2 h-6 rounded-[50%] bg-black/50 blur-[12px]" />
        <Image src={illustrationSrc} width={450} height={450} alt="" unoptimized priority className="relative size-full object-contain" />
      </div>
      <p className="mt-10 text-[88px] leading-none font-bold tracking-[-4px] text-content-strong sm:text-[120px]">{code}<span aria-hidden className="text-brand">.</span></p>
      <h1 id="route-status-title" className="mt-5 text-[28px] leading-[36px] font-semibold tracking-[-1px] text-content-strong">{title}</h1>
      <p className="mt-3 max-w-md text-[13px] leading-5 text-content">{description}</p>
      {details ? <div className="mt-4 max-w-md text-xs leading-5 text-content-muted">{details}</div> : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
    </section>
  );
}
