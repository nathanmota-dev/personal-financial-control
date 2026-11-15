import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { Onboarding } from "@/components/ui/onboarding";
import type { OnboardingStepHeaderProps } from "@/lib/interfaces/onboarding";
import { firstName, ONBOARDING_STEPS } from "@/lib/onboarding/steps";

export function OnboardingStepHeader({ step, totalSteps, name }: OnboardingStepHeaderProps) {
  const meta = ONBOARDING_STEPS[step] ?? ONBOARDING_STEPS[1];
  const title = meta.title(firstName(name));
  return <div className="relative border-b border-border px-6 pt-7 pb-5 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-hero sm:px-8">
    <DashboardCardIllustration src={meta.illustrationSrc} className="top-6 right-14 size-[72px] sm:size-[88px]" />
    <div className="pr-24 sm:pr-32">
      <p className="text-[10px] font-bold tracking-wider text-content uppercase" aria-live="polite">Etapa {step} de {totalSteps}</p>
      <Onboarding.StepIndicator variant="pills" className="mt-2 max-w-[220px] justify-start" aria-label={`Etapa ${step} de ${totalSteps}`} />
      <h2 className="mt-5 text-[28px] leading-[36px] font-semibold tracking-[-1px] text-content-strong">{title}{/[.!?]$/.test(title) ? null : <span aria-hidden="true" className="text-brand">.</span>}</h2>
      <p className="mt-2 text-[13px] leading-5 text-content">{meta.description}</p>
    </div>
  </div>;
}
