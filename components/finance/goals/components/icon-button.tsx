"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { IconButtonProps } from "../goals-types";

export function IconButton({
  label,
  children,
  onClick,
  disabled,
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={disabled}
          onClick={onClick}
          className="border-input bg-surface/70 text-content-strong hover:bg-surface-raised"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
