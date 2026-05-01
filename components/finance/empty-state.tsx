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
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Empty className="rounded-[1.75rem] border border-dashed border-slate-800 bg-slate-950/55 text-slate-100">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WalletCards className="text-sky-300" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action}
    </Empty>
  );
}
