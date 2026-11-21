import { LoginPreviewBills } from "@/components/auth/login-preview-bills";
import { LoginPreviewForecast } from "@/components/auth/login-preview-forecast";
import { LoginPreviewGoals } from "@/components/auth/login-preview-goals";
import type { LoginPreviewProps } from "@/lib/interfaces/login-preview";

const previews = { overview: LoginPreviewForecast, planning: LoginPreviewBills, goals: LoginPreviewGoals } as const;

/** A static dashboard card shown on the login carousel, with fictional data. */
export function LoginPreview({ variant }: LoginPreviewProps) {
  const Preview = previews[variant];
  return (
    <div aria-hidden="true" className="login-preview @container relative mx-auto w-full max-w-[410px] select-none rounded-[20px] border border-border bg-card p-[23px] text-left shadow-[0_24px_60px_-20px_rgba(0,0,0,0.22)]">
      <Preview />
      <p className="mt-5 text-[9px] tracking-wide text-content-muted">PRÉVIA ILUSTRATIVA · DADOS FICTÍCIOS</p>
    </div>
  );
}
