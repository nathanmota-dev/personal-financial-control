import type { CardBrandId, CardBrandTheme } from "@/lib/interfaces/dashboard-cards";

const BRUSHED_DARK =
  "bg-[linear-gradient(135deg,#2b2b2d_0%,#141415_55%,#232325_100%)]";

export const CARD_BRAND_THEMES: Record<CardBrandId, CardBrandTheme> = {
  santander: {
    id: "santander",
    label: "Santander",
    faceClassName: BRUSHED_DARK,
    textClassName: "text-white",
    badgeClassName: "bg-white/20 text-white",
    pattern: /santander/,
  },
  itau: {
    id: "itau",
    label: "Itaú",
    faceClassName: "bg-[#ec7000]",
    textClassName: "text-white",
    badgeClassName: "bg-white/25 text-white",
    pattern: /ita[uú]/,
  },
  nubank: {
    id: "nubank",
    label: "Nubank",
    faceClassName: "bg-[#8a05be]",
    textClassName: "text-white",
    badgeClassName: "bg-white/20 text-white",
    pattern: /nubank|\bnu\b/,
  },
  bradesco: {
    id: "bradesco",
    label: "Bradesco",
    faceClassName: "bg-[linear-gradient(135deg,#d6002f_0%,#a30022_100%)]",
    textClassName: "text-white",
    badgeClassName: "bg-white/20 text-white",
    pattern: /bradesco/,
  },
  bb: {
    id: "bb",
    label: "Banco do Brasil",
    faceClassName: "bg-[linear-gradient(135deg,#0038a8_0%,#00246e_100%)]",
    textClassName: "text-[#fcfc30]",
    badgeClassName: "bg-[#fcfc30]/20 text-[#fcfc30]",
    pattern: /banco do brasil|\bbb\b|ourocard/,
  },
  mercadopago: {
    id: "mercadopago",
    label: "Mercado Pago",
    faceClassName: "bg-[linear-gradient(135deg,#00a8e8_0%,#0077c8_100%)]",
    textClassName: "text-white",
    badgeClassName: "bg-white/25 text-white",
    pattern: /mercado\s*pago|mercadopago/,
  },
  inter: {
    id: "inter",
    label: "Banco Inter",
    faceClassName: "bg-[linear-gradient(135deg,#ff7a00_0%,#f25c00_100%)]",
    textClassName: "text-white",
    badgeClassName: "bg-white/25 text-white",
    pattern: /\binter\b|banco inter/,
  },
  amex: {
    id: "amex",
    label: "American Express",
    faceClassName: "bg-[linear-gradient(135deg,#2e77bb_0%,#1a4f87_100%)]",
    textClassName: "text-white",
    badgeClassName: "bg-white/20 text-white",
    pattern: /amex|american express/,
  },
  generic: {
    id: "generic",
    label: "Cartão",
    faceClassName: "bg-[linear-gradient(135deg,#3b82f6_0%,#1d4ed8_100%)]",
    textClassName: "text-white",
    badgeClassName: "bg-white/20 text-white",
    pattern: /$^/,
  },
};

const DETECTION_ORDER: CardBrandId[] = [
  "santander", "itau", "nubank", "bradesco", "bb", "mercadopago", "inter", "amex",
];

function normalizeName(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function detectCardBrand(name: string): CardBrandId {
  const text = name.toLowerCase();
  const plain = normalizeName(name);
  return (
    DETECTION_ORDER.find((id) => {
      const { pattern } = CARD_BRAND_THEMES[id];
      return pattern.test(text) || pattern.test(plain);
    }) ?? "generic"
  );
}
