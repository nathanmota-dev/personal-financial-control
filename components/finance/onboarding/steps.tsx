"use client";

import { FinancialPrivacyForm } from "@/components/finance/privacy/privacy-form";
import { Onboarding } from "@/components/ui/onboarding";
import type { OnboardingStepsProps } from "@/lib/interfaces/onboarding";
import { splitOnboardingAccounts } from "@/lib/onboarding/steps";
import { OnboardingAccountForm } from "./account-form";
import { OnboardingCardForm } from "./card-form";
import { OnboardingSavedList } from "./saved-list";
import { OnboardingSummaryStep } from "./summary-step";
import { OnboardingThemeStep } from "./theme-step";
import { OnboardingWelcomeStep } from "./welcome-step";

export function OnboardingSteps({ accounts, disabled, onSaved, onBusyChange, formRef }: OnboardingStepsProps) {
  const { bankAccounts, cards } = splitOnboardingAccounts(accounts);
  const formProps = { onSaved, onBusyChange, disabled, ref: formRef };

  return <>
    <Onboarding.Step step={1}><OnboardingWelcomeStep /></Onboarding.Step>
    <Onboarding.Step step={2}><OnboardingThemeStep /></Onboarding.Step>
    <Onboarding.Step step={3} className="grid gap-6 @xl:grid-cols-[minmax(0,1fr)_260px]">
      <FinancialPrivacyForm><OnboardingAccountForm {...formProps} /></FinancialPrivacyForm>
      <OnboardingSavedList credit={false} items={bankAccounts} />
    </Onboarding.Step>
    <Onboarding.Step step={4}>
      <FinancialPrivacyForm><OnboardingCardForm {...formProps} aside={<OnboardingSavedList credit items={cards} />} /></FinancialPrivacyForm>
    </Onboarding.Step>
    <Onboarding.Step step={5}><OnboardingSummaryStep bankAccounts={bankAccounts} cards={cards} /></Onboarding.Step>
  </>;
}
