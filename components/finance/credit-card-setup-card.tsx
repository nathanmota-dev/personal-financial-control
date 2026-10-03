import { Card, CardContent } from "@/components/ui/card";
import type { CreditCardSetupCardProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardSetupCard({ title, description, action }: CreditCardSetupCardProps) {
  return (
    <Card className="rounded-[20px] border-border bg-card shadow-none">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="font-medium text-content-strong">{title}</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-content">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
