import type * as React from "react"
import type { PropsWithChildren } from "react"
export type Orientation = "horizontal" | "vertical" | "grid"
export interface StepIndicatorProps
  extends React.ComponentPropsWithoutRef<"div"> {
  variant?: "dots" | "pills" | null
  currentStep: number
  totalSteps: number
  dotClassName?: string
}
export interface OnboardingContextValue {
  currentStep: number
  totalSteps: number
  stepValue: number
  setStep: (step: number | ((prev: number) => number)) => void
  setStepValue: (value: number | ((prev: number) => number)) => void
  maxStepValue: number
  canGoNext: boolean
  canGoBack: boolean
  handleBack: () => void
  handleNext: () => void
  handleComplete: () => void
  onComplete?: () => void
}
export interface OnboardingRootProps
  extends PropsWithChildren,
    Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  value?: number
  defaultValue?: number
  onValueChange?: (step: number) => void
  stepValue?: number
  defaultStepValue?: number
  onStepValueChange?: (value: number) => void
  totalSteps: number
  maxStepValue?: number
  onComplete?: () => void
  canGoNext?: (step: number, stepValue: number) => boolean
}
export interface OnboardingStepProps
  extends React.ComponentPropsWithoutRef<"div"> {
  step: number
}
export type OnboardingStepIndicatorProps = Omit<StepIndicatorProps, "currentStep" | "totalSteps">
export interface OnboardingHeaderProps
  extends React.ComponentPropsWithoutRef<"div"> {
  title?: string
  description?: string
  children?: React.ReactNode
}
export interface OnboardingNavigationProps
  extends React.ComponentPropsWithoutRef<"fieldset"> {
  backLabel?: string
  nextLabel?: string
  completeLabel?: string
  canGoNext?: boolean
  children?: React.ReactNode
}
export interface ChoiceGroupContextValue {
  value: string | null
  setValue: (value: string) => void
  name: string
  orientation: Orientation
}
export interface ChoiceGroupProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue"> {
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  name: string
  orientation?: Orientation
}
export interface ChoiceGroupItemProps
  extends React.ComponentPropsWithoutRef<"label"> {
  value: string
}
export interface FeatureCarouselContextValue {
  value: number
  setValue: (value: number | ((prev: number) => number)) => void
  totalItems: number
  isActive: (index: number) => boolean
}
export interface FeatureCarouselProps
  extends React.ComponentPropsWithoutRef<"div"> {
  value?: number
  defaultValue?: number
  onValueChange?: (index: number) => void
  totalItems?: number
}
export interface FeatureCarouselItemProps
  extends React.ComponentPropsWithoutRef<"button"> {
  index: number
}
export interface TipsListProps extends React.ComponentPropsWithoutRef<"div"> {
  title?: string
}
export interface TipsListItemProps
  extends React.ComponentPropsWithoutRef<"li"> {
  number?: number
}
