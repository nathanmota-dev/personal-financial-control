"use client"
import { OnboardingRoot } from "./onboarding/root"
import { OnboardingStep, OnboardingStepIndicator, OnboardingHeader, OnboardingNavigation } from "./onboarding/parts"
export const Onboarding = Object.assign(OnboardingRoot, {
  Step: OnboardingStep,
  StepIndicator: OnboardingStepIndicator,
  Header: OnboardingHeader,
  Navigation: OnboardingNavigation,
})
export { useOnboarding } from "./onboarding/root"
export { ChoiceGroup } from "./onboarding/choice"
export { FeatureCarousel } from "./onboarding/carousel"
export { TipsList } from "./onboarding/tips"
export { StepIndicator } from "./onboarding/indicator"
export type * from "./onboarding/contracts"
