import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LockShowcaseCarousel } from "@/components/auth/lock-showcase-carousel";

/** Brand-blue side of the lock screen, mirroring the app sidebar. */
export async function LockShowcase() {
  const t = await getTranslations("security.showcase");
  const slides = [
    { variant: "idle", title: t("idleTitle"), description: t("idleDescription") },
    { variant: "hash", title: t("hashTitle"), description: t("hashDescription") },
    { variant: "recovery", title: t("recoveryTitle"), description: t("recoveryDescription") },
  ] as const;
  const previewLabels = { idle: t("previewIdle"), pin: t("previewPin"), stored: t("previewStored"), google: t("previewGoogle"), newPin: t("previewNewPin") };
  return <section className="bg-hero relative hidden min-w-0 flex-col justify-center gap-7 overflow-hidden px-12 py-12 lg:flex xl:px-16">
    <div aria-hidden="true" className="relative mx-auto size-[200px]">
      <div className="absolute inset-x-9 bottom-1 h-6 rounded-[50%] bg-black/50 blur-[14px]" />
      <Image src="/images/lock-padlock.webp" width={450} height={450} alt="" unoptimized priority className="relative size-full object-contain" />
    </div>
    <div>
      <h2 className="text-[28px] leading-9 font-semibold tracking-[-0.5px]">{t("title")}</h2>
      <p className="mt-2 text-sm leading-6 text-white/75">{t("description")}</p>
    </div>
    <LockShowcaseCarousel label={t("carouselLabel")} slides={slides} previewLabels={previewLabels} />
  </section>;
}
