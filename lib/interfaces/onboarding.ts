import type { ReactNode, Ref } from "react";
import type { createAccountAction } from "@/app/actions/finance";

export interface OnboardingState {
  step: number;
  completedAt: string | null;
}
export type OnboardingUpdate = { step: number } | { completed: true };
export type OnboardingAccount = Pick<Awaited<ReturnType<typeof createAccountAction>>, "id" | "name" | "type" | "initialBalanceCents" | "creditClosingDay" | "creditDueDay">;
/** Saves a progress update and returns the resulting state. */
export type OnboardingPersist = (update: OnboardingUpdate) => Promise<OnboardingState>;
export type OnboardingBankAccountType = "checking" | "savings" | "cash";
export type OnboardingTheme = "light" | "dark" | "system";

export interface OnboardingGateProps {
  initialState: OnboardingState | null;
  name: string;
}
export interface OnboardingDemoPreviewProps {
  name: string;
}
export interface OnboardingFlowProps {
  state: OnboardingState;
  name: string;
  onDismiss: () => void;
  onStateChange: (state: OnboardingState) => void;
  /** Replaces the `/api/onboarding` writes, as in the demo preview. */
  persist?: OnboardingPersist;
}
/** Lets the flow save a filled-in but unsaved form before moving on. */
export interface OnboardingFormHandle {
  /** Resolves `true` when nothing is pending or the draft was saved. */
  submitPending: () => Promise<boolean>;
}
export interface OnboardingAccountFormProps {
  onSaved: (account: OnboardingAccount) => void;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
  ref?: Ref<OnboardingFormHandle>;
}
export interface OnboardingCardFormProps extends OnboardingAccountFormProps {
  /** Rendered under the card preview, such as the list of saved cards. */
  aside?: ReactNode;
}
export type OnboardingAccountCreateInput = Parameters<typeof createAccountAction>[0];
export interface OnboardingAccountSubmitOptions {
  onSaved: (account: OnboardingAccount) => void;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
}
export interface OnboardingStepsProps {
  accounts: OnboardingAccount[];
  disabled: boolean;
  onSaved: (account: OnboardingAccount) => void;
  onBusyChange: (busy: boolean) => void;
  formRef: Ref<OnboardingFormHandle>;
}
export interface OnboardingStepMeta {
  /** Uppercase micro-label naming the step. */
  label: string;
  title: (firstName: string) => string;
  description: string;
  illustrationSrc: string;
}
export interface OnboardingStepHeaderProps {
  step: number;
  totalSteps: number;
  name: string;
}
export interface OnboardingFooterProps {
  step: number;
  totalSteps: number;
  busy: boolean;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkipStep: () => void;
  onSkipAll: () => void;
  onComplete: () => void;
}
export interface OnboardingSavedListProps {
  credit: boolean;
  items: OnboardingAccount[];
}
export interface OnboardingThemePreviewProps {
  theme: OnboardingTheme;
}
export interface OnboardingSummaryStepProps {
  bankAccounts: OnboardingAccount[];
  cards: OnboardingAccount[];
}
export interface OnboardingFeature {
  title: string;
  description: string;
}
export interface OnboardingThemeFrameProps {
  mode: "light" | "dark";
}
