"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  SELECT_CONTENT_CLASSNAME,
  SELECT_ITEM_CLASSNAME,
  SELECT_TRIGGER_CLASSNAME,
} from "../goals-constants";
import type { SelectFieldProps } from "../goals-types";

export function SelectField({
  label,
  value,
  onValueChange,
  options,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-200">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={SELECT_TRIGGER_CLASSNAME}>
          <SelectValue placeholder="Selecionar" />
        </SelectTrigger>
        <SelectContent className={SELECT_CONTENT_CLASSNAME}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={SELECT_ITEM_CLASSNAME}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
