import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { LabeledInputProps } from "../goals-types";

export function LabeledInput({ id, label, ...props }: LabeledInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-200">
        {label}
      </Label>
      <Input id={id} {...props} />
    </div>
  );
}
