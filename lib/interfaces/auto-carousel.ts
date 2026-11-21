export type CarouselTone = "default" | "inverse";

export interface CarouselControlsProps {
  titles: readonly string[];
  selected: number;
  paused: boolean;
  tone?: CarouselTone;
  onNavigate: (index: number) => void;
  onTogglePause: () => void;
}

export type LockFeatureVariant = "idle" | "hash" | "recovery";

export interface LockShowcaseSlide {
  variant: LockFeatureVariant;
  title: string;
  description: string;
}

export type LockFeaturePreviewLabels = Record<"idle" | "pin" | "stored" | "google" | "newPin", string>;

export interface LockShowcaseCarouselProps {
  label: string;
  slides: readonly LockShowcaseSlide[];
  previewLabels: LockFeaturePreviewLabels;
}

export interface LockFeaturePreviewProps {
  variant: LockFeatureVariant;
  labels: LockFeaturePreviewLabels;
}
