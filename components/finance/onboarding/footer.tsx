import { ArrowLeft, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingFooterProps } from "@/lib/interfaces/onboarding";
import { ONBOARDING_OPTIONAL_STEPS } from "@/lib/onboarding/steps";

const buttonClassName = "h-10 gap-[10px] rounded-[10px] text-[13px] font-medium";

export function OnboardingFooter({ step, totalSteps, busy, loading, onBack, onNext, onSkipStep, onSkipAll, onComplete }: OnboardingFooterProps) {
  const optional = ONBOARDING_OPTIONAL_STEPS.includes(step);
  const last = step === totalSteps;
  return <div role="group" aria-label="Navegação da configuração" className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-border bg-card px-6 py-4 sm:flex-row sm:items-center sm:gap-3 sm:px-8">
    <div className="order-2 flex items-center justify-between gap-2 sm:order-1 sm:flex-1 sm:justify-start">
      {last ? null : <Button variant="ghost" className={`${buttonClassName} -ml-3 text-content`} disabled={busy} onClick={onSkipAll}>Pular configuração</Button>}
      {optional && <Button variant="ghost" className={`${buttonClassName} -mr-3 text-content sm:mr-0`} disabled={busy} onClick={onSkipStep}>Pular etapa</Button>}
    </div>
    <div className="order-1 flex gap-2 sm:order-2">
      {step > 1 && <Button variant="secondary" className={buttonClassName} disabled={busy} onClick={onBack}><ArrowLeft className="size-[17px]" />Voltar</Button>}
      {last
        ? <Button className={`${buttonClassName} flex-1 sm:flex-none`} disabled={busy} onClick={onComplete}><LayoutDashboard className="size-[17px]" />Ir para o Dashboard</Button>
        : <Button className={`${buttonClassName} flex-1 sm:flex-none`} disabled={busy || (optional && loading)} onClick={onNext}>Continuar<ArrowRight className="size-[17px]" /></Button>}
    </div>
  </div>;
}
