import type { OnboardingThemePreviewProps } from "@/lib/interfaces/onboarding";
import { OnboardingThemeFrame } from "./theme-frame";

/** Miniature of the app shell rendered with the tokens of the chosen theme. */
export function OnboardingThemePreview({ theme }: OnboardingThemePreviewProps) {
  if (theme !== "system") return <OnboardingThemeFrame mode={theme} />;
  return <div aria-hidden className="relative">
    <OnboardingThemeFrame mode="light" />
    <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-[200%]"><OnboardingThemeFrame mode="dark" /></div>
    </div>
  </div>;
}
