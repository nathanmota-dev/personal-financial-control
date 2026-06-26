import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 rounded-[1.75rem] border border-slate-800 bg-slate-950/75 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.35)] backdrop-blur md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-sky-300">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-100">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end lg:shrink-0 lg:flex-nowrap">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
