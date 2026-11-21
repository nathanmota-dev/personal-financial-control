"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState, type FocusEvent, type KeyboardEvent } from "react";

const AUTOPLAY_MS = 6000;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)");

/** Looping Embla carousel that autoplays until hovered, focused, paused or hidden. */
export function useAutoCarousel(count: number) {
  const [viewportRef, api] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    api.on("select", update);
    api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);

  useEffect(() => {
    if (!api || paused || hovered || focused) return;
    const motion = reducedMotion();
    const timer = window.setInterval(() => {
      if (!motion.matches && !document.hidden) api.scrollTo((api.selectedScrollSnap() + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [api, count, paused, hovered, focused, selected]);

  const navigate = (index: number) => api?.scrollTo(index, reducedMotion().matches);

  return {
    viewportRef,
    selected,
    paused,
    navigate,
    togglePause: () => setPaused(value => !value),
    regionProps: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: (event: FocusEvent<HTMLElement>) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        navigate(selected + (event.key === "ArrowRight" ? 1 : -1));
      },
    },
  };
}
