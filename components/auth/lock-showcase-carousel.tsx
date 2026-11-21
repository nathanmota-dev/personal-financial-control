"use client";

import { KeyRound, RotateCcw, Timer } from "lucide-react";
import { CarouselControls } from "@/components/auth/carousel-controls";
import { LockFeaturePreview } from "@/components/auth/lock-feature-preview";
import { useAutoCarousel } from "@/hooks/use-auto-carousel";
import type { LockShowcaseCarouselProps } from "@/lib/interfaces/auto-carousel";

const icons = { idle: Timer, hash: KeyRound, recovery: RotateCcw } as const;

/** One card per lock-screen safeguard, rotating on the brand panel. */
export function LockShowcaseCarousel({ label, slides, previewLabels }: LockShowcaseCarouselProps) {
  const { viewportRef, selected, paused, navigate, togglePause, regionProps } = useAutoCarousel(slides.length);
  return <section {...regionProps} aria-label={label} aria-roledescription="carrossel" className="min-w-0">
    <div ref={viewportRef} className="overflow-hidden">
      <div className="flex touch-pan-y">
        {slides.map(({ variant, title, description }, index) => {
          const Icon = icons[variant];
          return <div key={variant} role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${slides.length}: ${title}`} aria-hidden={selected !== index} className="min-w-0 flex-[0_0_100%] px-px">
            <article className="rounded-[20px] border border-white/18 bg-white/12 p-5">
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><Icon className="size-5" aria-hidden="true" /></span>
                <div className="min-w-0"><h3 className="text-[15px] font-semibold">{title}</h3><p className="mt-0.5 text-xs leading-5 text-white/70">{description}</p></div>
              </div>
              <div className="mt-5 border-t border-white/15 pt-4"><LockFeaturePreview variant={variant} labels={previewLabels} /></div>
            </article>
          </div>;
        })}
      </div>
    </div>
    <div className="mt-4"><CarouselControls tone="inverse" titles={slides.map(slide => slide.title)} selected={selected} paused={paused} onNavigate={navigate} onTogglePause={togglePause} /></div>
  </section>;
}
