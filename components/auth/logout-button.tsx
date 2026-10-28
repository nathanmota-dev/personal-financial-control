"use client";
import { Button } from "@/components/ui/button";
import type { LogoutButtonProps } from "@/lib/interfaces/auth";
import { LoaderCircle,LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
export function LogoutButton({ iconOnly = false, fullWidth = false }: LogoutButtonProps) {
  const t = useTranslations("security");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) throw new Error(t("error"));
      try { await (await import("@/lib/auth/client")).googleSignOut(); } catch {}
      // Discard the authenticated router cache and client state on logout.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Falha de conexão."); setBusy(false); }
  }
  const label = t(busy ? "loggingOut" : "logout");

  return (
    <div className={iconOnly ? "relative" : fullWidth ? "w-full" : "p-3"}>
      <Button
        type="button"
        variant={iconOnly ? "outline" : "ghost"}
        size={iconOnly ? "icon" : "default"}
        disabled={busy}
        onClick={logout}
        aria-label={label}
        title={label}
        className={fullWidth ? "h-10 w-full justify-start gap-3 rounded-lg px-2" : "rounded-xl"}
      >
        {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
        {!iconOnly && label}
      </Button>
      <p
        role="status"
        className={iconOnly && error
          ? "absolute top-full right-0 z-20 mt-2 w-52 rounded-xl border border-danger/20 bg-surface p-3 text-xs text-danger shadow-lg lg:top-auto lg:bottom-full lg:mt-0 lg:mb-2"
          : "text-xs text-danger"}
      >
        {error}
      </p>
    </div>
  );
}
