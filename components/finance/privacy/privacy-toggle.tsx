"use client";

import type { FinancialPrivacyToggleProps } from "@/lib/interfaces/financial-privacy";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinancialPrivacy } from "./privacy-context";

export function FinancialPrivacyToggle({ compact = false }: FinancialPrivacyToggleProps) {
  const { hidden, setHidden } = useFinancialPrivacy();
  const label = hidden ? "Mostrar valores" : "Ocultar valores";
  return <Button type="button" variant="outline" size={compact ? "icon-sm" : "sm"} aria-label={label} aria-pressed={hidden} aria-description={hidden ? "Valores financeiros ocultos" : "Valores financeiros visíveis"} title={label} onClick={() => setHidden(!hidden)}>
    {hidden ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
    <span className={compact ? "sr-only" : undefined}>{label}</span>
  </Button>;
}
