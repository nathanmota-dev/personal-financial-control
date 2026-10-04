"use client";
import { cn } from "@/lib/utils";

export function ViewToggle({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
        active ? "bg-surface-elevated text-content-strong" : "text-content hover:text-content"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
