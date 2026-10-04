"use client"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"
import type { StepIndicatorProps } from "./contracts"
const stepIndicatorVariants = cva("flex items-center justify-center gap-2", {
  variants: {
    variant: {
      dots: "",
      pills: "",
    },
  },
  defaultVariants: {
    variant: "dots",
  },
})
const stepDotVariants = cva("rounded-full transition-all duration-200", {
  variants: {
    variant: {
      dots: "data-[state=active]:bg-foreground data-[state=completed]:bg-foreground/60 data-[state=inactive]:bg-muted-foreground/30 size-2 data-[state=active]:size-2.5",
      pills:
        "data-[state=active]:bg-foreground data-[state=completed]:bg-foreground/60 data-[state=inactive]:bg-muted-foreground/30 h-1 max-w-8 flex-1 rounded-full",
    },
  },
  defaultVariants: {
    variant: "dots",
  },
})
export function StepIndicator({
  currentStep,
  totalSteps,
  variant = "dots",
  className,
  dotClassName,
  ...props
}: StepIndicatorProps) {
  return (
    <div
      aria-label={`Step ${currentStep} of ${totalSteps}`}
      aria-valuemax={totalSteps}
      aria-valuemin={1}
      aria-valuenow={currentStep}
      className={cn(stepIndicatorVariants({ variant }), className)}
      data-slot="onboarding-step-indicator"
      role="progressbar"
      {...props}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1
        const isActive = currentStep === stepNumber
        const isCompleted = currentStep > stepNumber
        let stepState: "active" | "completed" | "inactive" = "inactive"
        if (isActive) {
          stepState = "active"
        } else if (isCompleted) {
          stepState = "completed"
        }
        return (
          <div
            aria-current={isActive ? "step" : undefined}
            className={cn(stepDotVariants({ variant }), dotClassName)}
            data-slot="onboarding-step-dot"
            data-state={stepState}
            key={stepNumber}
          />
        )
      })}
    </div>
  )
}
