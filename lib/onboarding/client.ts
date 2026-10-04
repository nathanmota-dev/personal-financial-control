import type { OnboardingUpdate } from "@/lib/interfaces/onboarding";
import { onboardingStateSchema } from "./schema";

export async function requestOnboarding(update?: OnboardingUpdate) {
  const response = await fetch("/api/onboarding", {
    method: update ? "PATCH" : "GET",
    cache: "no-store",
    ...(update ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(update) } : {}),
  });
  const body = await response.json();
  if (!response.ok || body.ok !== true) throw new Error("Não foi possível salvar ou consultar a configuração. Tente novamente.");
  return onboardingStateSchema.parse(body.onboarding);
}
