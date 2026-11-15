import type { OnboardingAccount, OnboardingBankAccountType, OnboardingFeature, OnboardingStepMeta, OnboardingTheme } from "@/lib/interfaces/onboarding";

export const ONBOARDING_TOTAL_STEPS = 5;
/** Steps that only register optional data and can be skipped. */
export const ONBOARDING_OPTIONAL_STEPS = [3, 4];

/** Header of each step. */
export const ONBOARDING_STEPS: Record<number, OnboardingStepMeta> = {
  1: { label: "Boas-vindas", title: (firstName) => `Boas-vindas, ${firstName}!`, description: "Vamos organizar seu Finance para acompanhar o dinheiro com clareza. Leva menos de dois minutos.", illustrationSrc: "/images/onboarding-welcome.webp" },
  2: { label: "Aparência", title: () => "Do seu jeito", description: "Escolha a aparência mais confortável. Dá para trocar depois no menu do usuário.", illustrationSrc: "/images/onboarding-theme.webp" },
  3: { label: "Contas", title: () => "Suas contas", description: "Adicione onde você guarda e movimenta seu dinheiro. O saldo inicial é o ponto de partida.", illustrationSrc: "/images/balance-wallet.webp" },
  4: { label: "Cartões", title: () => "Seus cartões", description: "Informe os dias da fatura para acompanhar compras e vencimentos de cada cartão.", illustrationSrc: "/images/credit-card-cards.webp" },
  5: { label: "Pronto", title: () => "Tudo pronto!", description: "Seu Finance está configurado. Agora é só acompanhar suas finanças.", illustrationSrc: "/images/onboarding-done.webp" },
};

export const ONBOARDING_FEATURES: OnboardingFeature[] = [
  { title: "Contas e lançamentos", description: "Registre receitas e despesas do dia a dia." },
  { title: "Cartões e faturas", description: "Acompanhe compras, fechamento e vencimento." },
  { title: "Visão mensal", description: "Saldos, gastos e evolução no Dashboard." },
];

export const ONBOARDING_THEMES: { value: OnboardingTheme; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

export const ONBOARDING_ACCOUNT_TYPES: Record<OnboardingBankAccountType, string> = {
  checking: "Corrente",
  savings: "Poupança",
  cash: "Dinheiro",
};

export const ONBOARDING_NEXT_STEPS: OnboardingFeature[] = [
  { title: "Lançamentos", description: "Registre receitas e despesas conforme acontecem." },
  { title: "Cartões", description: "Acompanhe as compras e o vencimento das faturas." },
  { title: "Dashboard", description: "Veja saldos, gastos e evolução mensal." },
];

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "você";
}

export function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function splitOnboardingAccounts(accounts: OnboardingAccount[]) {
  return {
    bankAccounts: accounts.filter((account) => account.type !== "credit" && account.type !== "investment"),
    cards: accounts.filter((account) => account.type === "credit"),
  };
}
