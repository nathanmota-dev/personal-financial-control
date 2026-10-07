"use client";

import { useState } from "react";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FinancialPrivacyFormProps } from "@/lib/interfaces/financial-privacy";
import { FinancialPrivacyContext, useFinancialPrivacy } from "./privacy-context";

export function FinancialPrivacyForm({ children, dialog = false }: FinancialPrivacyFormProps) {
  const privacy = useFinancialPrivacy();
  const [revealed, setRevealed] = useState(false);
  if (!privacy.hidden && revealed) setRevealed(false);
  if (privacy.hidden && !revealed) {
    return <div className="space-y-3" role="group" aria-label="Edição protegida">
      {dialog ? <><DialogTitle>Edição de valores</DialogTitle><DialogDescription>Os valores deste formulário estão ocultos.</DialogDescription></> : <p className="text-sm text-content">Os valores deste formulário estão ocultos.</p>}
      <Button type="button" variant="outline" onClick={() => setRevealed(true)}>Mostrar valores para editar</Button>
    </div>;
  }
  return <FinancialPrivacyContext value={{ ...privacy, hidden: false }}>{children}</FinancialPrivacyContext>;
}
