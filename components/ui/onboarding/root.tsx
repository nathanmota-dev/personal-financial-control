"use client"
import { cn } from "@/lib/utils"
import { createContext, useContext, useCallback, useMemo } from "react"
import { useControllableState } from "@radix-ui/react-use-controllable-state"
import type { OnboardingContextValue, OnboardingRootProps } from "./contracts"
const OnboardingContext = createContext<OnboardingContextValue | null>(null)
export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error("Onboarding components must be used within Onboarding.Root")
  }
  return ctx
}
export function OnboardingRoot({
  value: controlledValue,
  defaultValue = 1,
  onValueChange,
  stepValue: controlledStepValue,
  defaultStepValue = 0,
  onStepValueChange,
  totalSteps,
  maxStepValue: controlledMaxStepValue = 0,
  onComplete,
  canGoNext: canGoNextFn,
  children,
  className,
  ...props
}: OnboardingRootProps) {
  const [currentStep, setCurrentStep] = useControllableState({
    prop: controlledValue,
    defaultProp: defaultValue,
    onChange: onValueChange,
  })
  const [stepValue, setStepValueState] = useControllableState({
    prop: controlledStepValue,
    defaultProp: defaultStepValue,
    onChange: onStepValueChange,
  })
  const maxStepValue = controlledMaxStepValue ?? 0
  const canGoNext = canGoNextFn ? canGoNextFn(currentStep, stepValue) : true
  const canGoBack = currentStep > 1 || stepValue > 0
  const handleNext = useCallback(() => {
    if (currentStep === 1 && stepValue < maxStepValue) {
      setStepValueState((prev) => prev + 1)
    } else if (currentStep < totalSteps) {
      setStepValueState(0)
      setCurrentStep((prev) => prev + 1)
    }
  }, [
    currentStep,
    stepValue,
    maxStepValue,
    totalSteps,
    setStepValueState,
    setCurrentStep,
  ])
  const handleBack = useCallback(() => {
    if (currentStep === 1 && stepValue > 0) {
      setStepValueState((prev) => prev - 1)
    } else if (currentStep === 2) {
      setCurrentStep(1)
      setStepValueState(maxStepValue)
    } else if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep, stepValue, maxStepValue, setStepValueState, setCurrentStep])
  const handleComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])
  const contextValue = useMemo<OnboardingContextValue>(
    () => ({
      currentStep,
      totalSteps,
      stepValue,
      setStep: setCurrentStep,
      setStepValue: setStepValueState,
      maxStepValue,
      canGoNext,
      canGoBack,
      handleBack,
      handleNext,
      handleComplete,
      onComplete,
    }),
    [currentStep, totalSteps, stepValue, setCurrentStep, setStepValueState, maxStepValue,
      canGoNext, canGoBack, handleBack, handleNext, handleComplete, onComplete]
  )
  return (
    <OnboardingContext.Provider value={contextValue}>
      <div
        className={cn(
          "bg-background flex flex-col rounded-xl border p-6 shadow-sm",
          className
        )}
        data-slot="onboarding"
        data-state={`step-${currentStep}`}
        {...props}
      >
        {children}
      </div>
    </OnboardingContext.Provider>
  )
}
