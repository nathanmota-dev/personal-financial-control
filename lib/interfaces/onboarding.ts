import type { createAccountAction } from "@/app/actions/finance";

export interface OnboardingState {
  step: number;
  completedAt: string | null;
}
export type OnboardingUpdate = { step: number } | { completed: true };
export type OnboardingAccount = Pick<Awaited<ReturnType<typeof createAccountAction>>, "id" | "name" | "type" | "initialBalanceCents" | "creditClosingDay" | "creditDueDay">;
export interface OnboardingGateProps {
  initialState: OnboardingState | null;
  name: string;
}
export interface OnboardingFlowProps {
  state: OnboardingState;
  name: string;
  onDismiss: () => void;
  onStateChange: (state: OnboardingState) => void;
}
export interface OnboardingAccountFormProps {
  credit: boolean;
  onSaved: (account: OnboardingAccount) => void;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
}
export interface OnboardingStepsProps {
  name: string;
  accounts: OnboardingAccount[];
  disabled: boolean;
  onSaved: (account: OnboardingAccount) => void;
  onBusyChange: (busy: boolean) => void;
}
