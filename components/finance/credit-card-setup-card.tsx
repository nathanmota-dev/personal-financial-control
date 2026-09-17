import { Card, CardContent } from "@/components/ui/card";
import type { CreditCardSetupCardProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardSetupCard({ title, description, action }: CreditCardSetupCardProps) {
  return (
    <Card className="rounded-[1.75rem] border-sky-900/70 bg-sky-950/25 shadow-[0_24px_70px_rgba(14,165,233,0.08)]">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="font-medium text-slate-100">{title}</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
