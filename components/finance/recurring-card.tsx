"use client";

import {
PauseRecurringButton,
RecurringDeleteDialog,
ResumeRecurringButton,
} from "@/components/finance/recurring-actions";
import { RecurringDialog } from "@/components/finance/recurring-dialog";
import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { Button } from "@/components/ui/button";
import {
Card,
CardFooter,
CardHeader
} from "@/components/ui/card";
import {
getStatusTone,
recurringStatusLabels,
transactionTypeLabels
} from "@/lib/finance-ui";
import type { RecurringCardProps } from "@/lib/interfaces/recurring";
import {
Pencil,
Repeat2
} from "lucide-react";
import { RecurringCardCardContent1 } from "./recurring-card-recurring-card-card-content1";

export function RecurringCard({
  template,
  accounts,
  categories,
  month,
}: RecurringCardProps) {
  const generated = template.lastGeneratedMonth === month;

  return (
    <Card className="h-full min-w-0 gap-5">
      <CardHeader className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Repeat2 className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 data-user-content className="break-words text-base font-semibold leading-snug text-content-strong">
            {template.description}
          </h3>
          <p className="mt-1 text-xs text-content">
            {transactionTypeLabels[template.type]} · Mensal
          </p>
        </div>
        <StatusDotBadge tone={getStatusTone(template.status)}>
          {recurringStatusLabels[template.status]}
        </StatusDotBadge>
      </CardHeader>
      <RecurringCardCardContent1 template={template} generated={generated} month={month} />
      <CardFooter className="flex flex-wrap items-center gap-2">
        <RecurringDialog
          accounts={accounts}
          categories={categories}
          month={month}
          template={template}
          trigger={
            <Button variant="outline">
              <Pencil className="size-4" />
              Editar
            </Button>
          }
        />
        {template.status === "active" ? (
          <PauseRecurringButton id={template.id} />
        ) : template.status === "paused" ? (
          <ResumeRecurringButton id={template.id} />
        ) : null}
        <div className="ml-auto">
          <RecurringDeleteDialog id={template.id} />
        </div>
      </CardFooter>
    </Card>
  );
}
