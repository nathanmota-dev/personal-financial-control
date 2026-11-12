import type { CreditCardBrandLogoProps } from "@/lib/interfaces/dashboard-cards";
import { CARD_BRAND_THEMES } from "@/lib/credit-card-brands";

const WORDMARKS = {
  nubank: "font-bold lowercase tracking-tight text-[22px]",
  bradesco: "font-bold tracking-tight text-[17px]",
  bb: "font-extrabold tracking-tight text-[18px]",
  mercadopago: "font-bold tracking-tight text-[15px]",
  inter: "font-bold lowercase tracking-tight text-[22px]",
  amex: "font-extrabold uppercase tracking-[0.12em] text-[13px] border-2 border-current px-1.5 py-0.5",
} as const;

const WORDMARK_TEXT = {
  nubank: "nu",
  bradesco: "Bradesco",
  bb: "BB",
  mercadopago: "mercado pago",
  inter: "inter",
  amex: "Amex",
} as const;

export function CreditCardBrandLogo({ brand, name }: CreditCardBrandLogoProps) {
  if (brand === "santander") {
    return (
      <span className="flex items-center gap-1.5 text-[15px] font-semibold">
        <svg viewBox="0 0 24 24" aria-hidden className="size-[18px] fill-[#ec0000]">
          <path d="M12 1c1.2 3.2.2 5.4-1.2 7.4C9 10.900 7 12.700 7 16a5 5 0 0 0 5 5c-1-2-.4-3.600.900-5.200C14.800 13.600 18 11.500 18 8c0-2.900-2.600-5.300-6-7Z" />
        </svg>
        Santander
      </span>
    );
  }
  if (brand === "itau") {
    return (
      <span
        role="img"
        aria-label="Itaú"
        className="flex size-[34px] items-center justify-center rounded-[7px] bg-[#003399] text-[13px] font-extrabold text-white"
      >
        itaú
      </span>
    );
  }
  if (brand === "generic") {
    return <span className="max-w-[150px] truncate text-[15px] font-semibold">{name}</span>;
  }
  return (
    <span
      role="img"
      aria-label={CARD_BRAND_THEMES[brand].label}
      className={`inline-block rounded-[3px] leading-none ${WORDMARKS[brand]}`}
    >
      {WORDMARK_TEXT[brand]}
    </span>
  );
}
