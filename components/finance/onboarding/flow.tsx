"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Onboarding } from "@/components/ui/onboarding";
import type { OnboardingFlowProps, OnboardingFormHandle } from "@/lib/interfaces/onboarding";
import { useOnboardingFlow } from "@/hooks/use-onboarding-flow";
import { ONBOARDING_TOTAL_STEPS } from "@/lib/onboarding/steps";
import { OnboardingFooter } from "./footer";
import { OnboardingStepHeader } from "./step-header";
import { OnboardingSteps } from "./steps";

export default function OnboardingFlow(props: OnboardingFlowProps) {
  const { state, name, onDismiss } = props;
  const flow = useOnboardingFlow(props);
  const formRef = useRef<OnboardingFormHandle>(null);

  async function next() {
    // A filled-in form is saved before moving on, so a typed account is never lost.
    if (formRef.current && !await formRef.current.submitPending()) return;
    await flow.save({ step: state.step + 1 });
  }

  return <Dialog open onOpenChange={open => { if (!open) onDismiss(); }}>
    <DialogContent className="gap-0 bg-card p-0 sm:max-w-[720px]" onInteractOutside={event => event.preventDefault()}>
      <DialogTitle className="sr-only">Configuração inicial do Finance</DialogTitle>
      <DialogDescription className="sr-only">Cinco etapas para personalizar o tema e cadastrar contas e cartões.</DialogDescription>
      <Onboarding value={state.step} totalSteps={ONBOARDING_TOTAL_STEPS} className="gap-0 rounded-none border-0 bg-transparent p-0 shadow-none">
        <OnboardingStepHeader step={state.step} totalSteps={ONBOARDING_TOTAL_STEPS} name={name} />
        <div className="@container space-y-4 px-6 py-6 sm:px-8">
          <OnboardingSteps accounts={flow.accounts} disabled={flow.busy || flow.accountsLoading || flow.accountsError} onSaved={flow.accountSaved} onBusyChange={flow.accountBusy} formRef={formRef} />
          {flow.accountsError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border p-4 text-xs text-content">
            <p>Não foi possível carregar seus cadastros.</p><Button variant="outline" size="sm" disabled={flow.accountsLoading || flow.busy} onClick={flow.reloadAccounts}>Recarregar cadastros</Button>
          </div>}
          {flow.error && <p role="alert" className="text-xs text-destructive">{flow.error}</p>}
        </div>
        <OnboardingFooter
          step={state.step}
          totalSteps={ONBOARDING_TOTAL_STEPS}
          busy={flow.busy}
          loading={flow.accountsLoading}
          onBack={() => void flow.save({ step: state.step - 1 })}
          onNext={() => void next()}
          onSkipStep={() => void flow.save({ step: state.step + 1 })}
          onSkipAll={() => void flow.save({ completed: true })}
          onComplete={() => void flow.save({ completed: true })}
        />
      </Onboarding>
    </DialogContent>
  </Dialog>;
}
