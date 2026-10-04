"use client";

import {
Dialog
} from "@/components/ui/dialog";
import { ContributionDialogDialogContent1 } from "./contribution-dialog-contribution-dialog-dialog-content1";

import type { ContributionDialogProps } from "../goals-types";

export function ContributionDialog({
  state,
  form,
  setForm,
  sourceAccounts,
  investmentCategories,
  isPending,
  onOpenChange,
  onSubmit,
}: ContributionDialogProps) {
  const canSubmit =
    form.amount &&
    form.transactionDate &&
    form.accountId &&
    form.categoryId &&
    sourceAccounts.length &&
    investmentCategories.length;

  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <ContributionDialogDialogContent1 state={state} sourceAccounts={sourceAccounts} investmentCategories={investmentCategories} onSubmit={onSubmit} form={form} setForm={setForm} onOpenChange={onOpenChange} isPending={isPending} canSubmit={canSubmit} />
    </Dialog>
  );
}
