import { CreditCard, Info, LayoutDashboard, Wallet } from "lucide-react";
import { IconTile } from "@/components/finance/ds/icon-tile";
import { ONBOARDING_FEATURES } from "@/lib/onboarding/steps";

const icons = [Wallet, CreditCard, LayoutDashboard];

export function OnboardingWelcomeStep() {
  return <div className="space-y-5">
    <p className="text-[10px] font-bold tracking-wider text-content uppercase">O que você organiza aqui</p>
    <ul className="grid gap-3 @lg:grid-cols-3">
      {ONBOARDING_FEATURES.map((feature, index) => {
        const Icon = icons[index];
        return <li key={feature.title} className="flex min-w-0 gap-3 rounded-[14px] border border-border p-4 @lg:flex-col">
          <IconTile tone="brand"><Icon /></IconTile>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-content-strong">{feature.title}</p>
            <p className="mt-0.5 text-xs leading-5 text-content">{feature.description}</p>
          </div>
        </li>;
      })}
    </ul>
    <p className="flex items-start gap-2.5 rounded-[14px] bg-primary/10 px-4 py-3 text-xs leading-5 text-brand-strong">
      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />Contas e cartões são opcionais. Você pode cadastrá-los depois em Configurações.
    </p>
  </div>;
}
