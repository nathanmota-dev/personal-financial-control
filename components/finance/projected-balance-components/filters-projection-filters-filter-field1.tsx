"use client";

import { FilterField } from "@/components/finance/projected-balance-components/filter-field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover,PopoverContent,PopoverTrigger } from "@/components/ui/popover";
import {
formatDateLabel
} from "@/lib/finance-ui";
import type { ProjectionFiltersFilterField1Props } from "@/lib/interfaces/render/filters-projection-filters-filter-field1";
import { cn } from "@/lib/utils";
import { filterInputClassName,formatDateInputValue,parseDateInputValue } from "@/lib/utils/components/filters";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

export function ProjectionFiltersFilterField1({ isStartDatePickerOpen, setIsStartDatePickerOpen, filters, updateFilters }: ProjectionFiltersFilterField1Props) {
  return (
<FilterField label="Data inicial">
            <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    filterInputClassName,
                    "w-full justify-between px-4 text-left"
                  )}
                  aria-label={`Selecionar data inicial: ${formatDateLabel(filters.startDate)}`}
                >
                  <span>{formatDateLabel(filters.startDate)}</span>
                  <CalendarDays className="size-4 text-content" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto overflow-hidden rounded-[20px] border border-border bg-card p-0 text-content-strong shadow-none"
              >
                <Calendar
                  mode="single"
                  selected={parseDateInputValue(filters.startDate)}
                  onSelect={(date) => {
                    if (!date) {
                      return;
                    }

                    updateFilters({ startDate: formatDateInputValue(date) });
                    setIsStartDatePickerOpen(false);
                  }}
                  locale={ptBR}
                  className="text-content-strong"
                />
              </PopoverContent>
            </Popover>
          </FilterField>
  );
}
