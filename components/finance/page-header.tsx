import type { PageHeaderProps } from "@/lib/interfaces/finance-presentation";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return <header className={cn("flex min-h-[104px] flex-wrap items-start justify-between gap-x-8 gap-y-4 pt-[17px] pb-2", className)}>
    <div className="min-w-0 flex-1 basis-[320px]">
      {eyebrow && <p className="sr-only">{eyebrow}</p>}
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-1px] text-content-strong sm:text-[35px]">{title}</h1>
      <p className="mt-2 max-w-2xl text-xs leading-5 text-content">{description}</p>
    </div>
    {actions && <div className="flex max-w-full flex-wrap items-center gap-3 pt-[5px] [&>div]:max-w-full [&>div]:flex-wrap">{actions}</div>}
  </header>;
}
