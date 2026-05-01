"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InvestmentsActions({ customMonths }: { customMonths: number }) {
  return (
    <form className="flex items-center gap-3">
      <Input type="number" min={1} name="customMonths" defaultValue={customMonths} className="w-28" />
      <Button type="submit" variant="outline">
        Simular prazo
      </Button>
    </form>
  );
}
