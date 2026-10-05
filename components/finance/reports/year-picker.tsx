"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ReportYearPickerProps } from "@/lib/interfaces/reports";

export function ReportYearPicker({ year, onYearChange }: ReportYearPickerProps) {
  const [open, setOpen] = useState(false);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button variant="outline" className="w-[188px] justify-between px-4 text-sm" aria-label={`Selecionar ano: ${year}`}>{year}<CalendarDays className="text-content" /></Button></PopoverTrigger>
    <PopoverContent align="end" className="w-64 rounded-xl shadow-none">
      <form className="space-y-3" onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("year"));
        onYearChange(value.padStart(4, "0"));
        setOpen(false);
      }}>
        <Label htmlFor="report-year">Ano do relatório</Label>
        <Input id="report-year" name="year" type="number" min="2" max="9998" defaultValue={Number(year)} required />
        <Button type="submit" className="w-full">Consultar ano</Button>
      </form>
    </PopoverContent>
  </Popover>;
}
