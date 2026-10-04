"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Onboarding } from "@/components/ui/onboarding";
import type { OnboardingFlowProps } from "@/lib/interfaces/onboarding";
import { useOnboardingFlow } from "@/hooks/use-onboarding-flow";
import { OnboardingSteps } from "./steps";

export default function OnboardingFlow(props: OnboardingFlowProps) {
  const { state, name, onDismiss } = props;
  const flow = useOnboardingFlow(props);
  const optional = state.step === 3 || state.step === 4;

  return <Dialog open onOpenChange={open => { if (!open) onDismiss(); }}>
    <DialogContent className="sm:max-w-xl" onInteractOutside={event => event.preventDefault()}>
      <DialogTitle className="sr-only">Configuração inicial do Finance</DialogTitle>
      <DialogDescription className="sr-only">Cinco etapas para personalizar o tema e cadastrar contas e cartões.</DialogDescription>
      <Onboarding value={state.step} totalSteps={5} onValueChange={step => void flow.save({ step })} onComplete={() => void flow.save({ completed: true })}
        className="gap-6 border-0 bg-transparent p-0 shadow-none [&_[data-slot=onboarding-header]]:text-left [&_[data-slot=onboarding-description]]:text-sm">
        <div className="space-y-3 pr-10">
          <p className="text-sm text-muted-foreground" aria-live="polite">Etapa {state.step} de 5</p>
          <Onboarding.StepIndicator variant="pills" className="justify-start" aria-label={`Etapa ${state.step} de 5`} />
        </div>
        <OnboardingSteps name={name} accounts={flow.accounts} disabled={flow.busy || flow.accountsLoading || flow.accountsError} onSaved={flow.accountSaved} onBusyChange={flow.accountBusy} />
        {flow.accountsError && <div role="alert" className="space-y-2 text-sm">
          <p>Não foi possível carregar seus cadastros.</p><Button variant="outline" disabled={flow.accountsLoading || flow.busy} onClick={flow.reloadAccounts}>Recarregar cadastros</Button>
        </div>}
        {flow.error && <p role="alert" className="text-sm text-destructive">{flow.error}</p>}
        <Onboarding.Navigation disabled={flow.busy || (optional && flow.accountsLoading)} backLabel="Voltar" nextLabel="Continuar" completeLabel="Ir para o Dashboard" aria-label="Navegação da configuração" />
        <div className="flex flex-wrap justify-between gap-2 border-t pt-3">
          {optional && <Button variant="ghost" disabled={flow.busy} onClick={() => void flow.save({ step: state.step + 1 })}>Pular etapa</Button>}
          <Button variant="ghost" className="ml-auto text-muted-foreground" disabled={flow.busy} onClick={() => void flow.save({ completed: true })}>Pular configuração</Button>
        </div>
      </Onboarding>
    </DialogContent>
  </Dialog>;
}
