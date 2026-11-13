import Image from "next/image";
import { KeyRound, RotateCcw, Timer } from "lucide-react";
import { getTranslations } from "next-intl/server";

const items = [
  { icon: Timer, title: "idleTitle", description: "idleDescription" },
  { icon: KeyRound, title: "hashTitle", description: "hashDescription" },
  { icon: RotateCcw, title: "recoveryTitle", description: "recoveryDescription" },
] as const;

/** Brand-blue side of the lock screen, mirroring the app sidebar. */
export async function LockShowcase() {
  const t = await getTranslations("security.showcase");
  return <section className="bg-hero relative hidden min-w-0 flex-col justify-center gap-8 overflow-hidden px-12 py-12 lg:flex xl:px-16">
    <div aria-hidden="true" className="relative mx-auto size-[240px]">
      <div className="absolute inset-x-10 bottom-1 h-7 rounded-[50%] bg-black/50 blur-[14px]" />
      <Image src="/images/lock-padlock.webp" width={450} height={450} alt="" unoptimized priority className="relative size-full object-contain" />
    </div>
    <div>
      <h2 className="text-[28px] leading-9 font-semibold tracking-[-0.5px]">{t("title")}</h2>
      <p className="mt-2 text-sm leading-6 text-white/75">{t("description")}</p>
    </div>
    <ul className="space-y-2.5">
      {items.map(({ icon: Icon, title, description }) => <li key={title} className="flex items-center gap-3.5 rounded-[14px] border border-white/18 bg-white/12 px-4 py-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><Icon className="size-[18px]" aria-hidden="true" /></span>
        <span className="min-w-0"><span className="block text-[13px] font-semibold">{t(title)}</span><span className="mt-0.5 block text-xs text-white/70">{t(description)}</span></span>
      </li>)}
    </ul>
  </section>;
}
