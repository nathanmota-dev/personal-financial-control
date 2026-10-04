import type { Select } from "@/components/ui/select";
import type {
CreditCardCategoryOption,
CreditCardChargeForEdit,
} from "@/lib/interfaces/credit-card";
import type { ComponentProps,ReactNode } from "react";

export type MoneyInputProps = Omit<
  ComponentProps<"input">,
  "type" | "defaultValue" | "value"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};
export type FormSelectProps = ComponentProps<typeof Select> & {
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
};
export type AccountRow = {
  id: string;
  name: string;
  type: "checking" | "savings" | "cash" | "credit" | "investment";
  initialBalanceCents: number;
  creditClosingDay: number | null;
  creditDueDay: number;
};
export type CategoryRow = {
  id: string;
  name: string;
  group: "income" | "fixed_expense" | "variable_expense" | "investment";
};
export type AccountSetupDialogProps = {
  account?: AccountRow;
  trigger?: ReactNode;
};
export type CategorySetupDialogProps = {
  category?: CategoryRow;
  trigger?: ReactNode;
};
export type SetupCalloutProps = { title: string; description: string };
export type CreditCardPurchaseDialogProps = {
  accountId: string;
  categories: CreditCardCategoryOption[];
  month: string;
  disabled?: boolean;
  charge?: CreditCardChargeForEdit;
  trigger?: ReactNode;
};
export type StatusDotBadgeProps = {
  children: ReactNode;
  tone: string;
  className?: string;
};

export type FinanceFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};
