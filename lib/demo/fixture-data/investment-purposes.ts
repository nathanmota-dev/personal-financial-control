import type { DemoFixture } from "@/lib/demo/contracts";
import { id } from "./support";

export const investmentPurposes: DemoFixture["investmentPurposes"] = [
    {
      id: id("92000000-0000-4000-8000", 1),
      name: "Reserva de emergência",
      kind: "emergency_reserve",
      targetAmountCents: 3000000,
      color: "#2dd4bf",
      notes: "Acesso rápido para imprevistos e transições.",
    },
    {
      id: id("92000000-0000-4000-8000", 2),
      name: "Carro",
      targetAmountCents: 8000000,
      color: "#f59e0b",
      notes: "Patrimônio reservado para a próxima troca de carro.",
    },
  ];
