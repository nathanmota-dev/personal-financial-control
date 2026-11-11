import Image from "next/image";

/** App icon and wordmark shared by the sidebar, login and lock screens. */
export function AppBrand() {
  return (
    <span className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
      <Image src="/icon.png" width={32} height={32} sizes="32px" unoptimized alt="" className="size-8 shrink-0 rounded-lg object-contain" />
      finance
    </span>
  );
}
