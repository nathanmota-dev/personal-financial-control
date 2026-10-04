import type { FinanceEmptyStateProps } from "@/lib/interfaces/finance-presentation";
import { WalletCards } from "lucide-react";

import {
Empty,
EmptyDescription,
EmptyHeader,
EmptyMedia,
EmptyTitle,
} from "@/components/ui/empty";

export function FinanceEmptyState({
  title,
  description,
  action,
}: FinanceEmptyStateProps) {
  return (
    <Empty className="rounded-[20px] border border-dashed border-border bg-muted/30 text-content-strong">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WalletCards className="text-brand" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action}
    </Empty>
  );
}
