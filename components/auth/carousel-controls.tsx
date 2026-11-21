import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { CarouselControlsProps } from "@/lib/interfaces/auto-carousel";

const tones = {
  default: {
    control: "text-content hover:bg-surface-raised hover:text-content-strong focus-visible:outline-ring",
    active: "bg-content-strong",
    idle: "bg-content-muted/40",
    focus: "focus-visible:outline-ring",
  },
  inverse: {
    control: "text-white/75 hover:bg-white/12 hover:text-white focus-visible:outline-white",
    active: "bg-white",
    idle: "bg-white/40",
    focus: "focus-visible:outline-white",
  },
} as const;

/** Previous, dots, next and pause controls shared by the auth carousels. */
export function CarouselControls({ titles, selected, paused, tone = "default", onNavigate, onTogglePause }: CarouselControlsProps) {
  const palette = tones[tone];
  const controlClass = `flex size-9 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 ${palette.control}`;
  return (
    <div className="flex items-center justify-center gap-5">
      <button type="button" aria-label="Slide anterior" className={controlClass} onClick={() => onNavigate(selected - 1)}><ChevronLeft className="size-4" /></button>
      <div className="flex items-center gap-1">{titles.map((title, index) => <button key={title} type="button" aria-label={`Ver slide ${index + 1}: ${title}`} aria-current={selected === index ? "true" : undefined} onClick={() => onNavigate(index)} className={`flex h-9 min-w-7 items-center justify-center rounded-full focus-visible:outline-2 ${palette.focus}`}><span className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${selected === index ? `w-6 ${palette.active}` : `w-1.5 ${palette.idle}`}`} /></button>)}</div>
      <button type="button" aria-label="Próximo slide" className={controlClass} onClick={() => onNavigate(selected + 1)}><ChevronRight className="size-4" /></button>
      <button type="button" aria-label={paused ? "Retomar slides automáticos" : "Pausar slides automáticos"} className={controlClass} onClick={onTogglePause}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>
    </div>
  );
}
