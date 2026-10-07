"use client";

import type { ComponentProps } from "react";
import { DialogContent as Content } from "@/components/ui/dialog";
import { FinancialPrivacyForm } from "./privacy-form";
import { useFinancialPrivacy } from "./privacy-context";

export function DialogContent({ children, ...props }: ComponentProps<typeof Content>) {
  const { hidden } = useFinancialPrivacy();
  return <Content {...props}>
    <FinancialPrivacyForm dialog key={String(hidden)}>{children}</FinancialPrivacyForm>
  </Content>;
}
