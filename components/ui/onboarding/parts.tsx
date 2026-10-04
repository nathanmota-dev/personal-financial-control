"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "./indicator"
import { useOnboarding } from "./root"
import type { OnboardingStepProps, OnboardingStepIndicatorProps, OnboardingHeaderProps, OnboardingNavigationProps } from "./contracts"
export function OnboardingStep({
  step,
  children,
  className,
  ...props
}: OnboardingStepProps) {
  const { currentStep } = useOnboarding()
  const isActive = currentStep === step
  if (!isActive) {
    return null
  }
  return (
    <div
      className={cn(className)}
      data-slot="onboarding-step"
      data-state="active"
      {...props}
    >
      {children}
    </div>
  )
}
export function OnboardingStepIndicator(props: OnboardingStepIndicatorProps) {
  const { currentStep, totalSteps } = useOnboarding()
  return (
    <StepIndicator
      currentStep={currentStep}
      totalSteps={totalSteps}
      {...props}
    />
  )
}
export function OnboardingHeader({
  title,
  description,
  children,
  className,
  ...props
}: OnboardingHeaderProps) {
  if (children) {
    return (
      <div
        className={cn("text-center", className)}
        data-slot="onboarding-header"
        {...props}
      >
        {children}
      </div>
    )
  }
  return (
    <div
      className={cn(
        "flex flex-col gap-1 text-center",
        "[&_[data-slot=onboarding-title]]:text-foreground [&_[data-slot=onboarding-title]]:font-sans [&_[data-slot=onboarding-title]]:text-2xl [&_[data-slot=onboarding-title]]:font-semibold",
        "[&_[data-slot=onboarding-description]]:text-muted-foreground [&_[data-slot=onboarding-description]]:text-base",
        className
      )}
      data-slot="onboarding-header"
      {...props}
    >
      {title != null && <h2 data-slot="onboarding-title">{title}</h2>}
      {description && <p data-slot="onboarding-description">{description}</p>}
    </div>
  )
}
export function OnboardingNavigation({
  backLabel = "Back",
  nextLabel = "Next",
  completeLabel = "Start Creating",
  canGoNext: canGoNextOverride,
  children,
  className,
  ...props
}: OnboardingNavigationProps) {
  const {
    currentStep,
    totalSteps,
    canGoNext: contextCanGoNext,
    canGoBack,
    handleBack,
    handleNext,
    handleComplete,
  } = useOnboarding()
  const canGoNext = canGoNextOverride ?? contextCanGoNext
  const isLastStep = currentStep === totalSteps
  if (children) {
    return (
      <fieldset
        className={cn("flex gap-3", className)}
        data-slot="onboarding-navigation"
        {...props}
      >
        {children}
      </fieldset>
    )
  }
  return (
    <fieldset
      aria-label="Onboarding navigation"
      className={cn("flex gap-3", className)}
      data-slot="onboarding-navigation"
      {...props}
    >
      <Button
        aria-label={backLabel}
        className="flex-1 rounded-xl py-5"
        data-slot="onboarding-back"
        disabled={!canGoBack}
        onClick={handleBack}
        variant="outline"
      >
        {backLabel}
      </Button>
      {isLastStep ? (
        <Button
          aria-label={completeLabel}
          className="bg-foreground text-background hover:bg-foreground/90 flex-1 rounded-xl py-5"
          data-slot="onboarding-complete"
          onClick={handleComplete}
        >
          {completeLabel}
        </Button>
      ) : (
        <Button
          aria-label={nextLabel}
          className="bg-foreground text-background hover:bg-foreground/90 flex-1 rounded-xl py-5"
          data-slot="onboarding-next"
          disabled={!canGoNext}
          onClick={handleNext}
        >
          {nextLabel}
        </Button>
      )}
    </fieldset>
  )
}
