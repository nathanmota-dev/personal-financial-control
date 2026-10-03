import { MoneyInput } from "@/components/finance/money-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { LabeledInputProps } from "../goals-types";

export function LabeledInput({
  id,
  label,
  monetary,
  ...props
}: LabeledInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-content-strong">
        {label}
      </Label>
      {monetary ? (
        <MoneyInput
          {...props}
          id={id}
          value={props.value === undefined ? undefined : String(props.value)}
          defaultValue={
            props.defaultValue === undefined
              ? undefined
              : String(props.defaultValue)
          }
        />
      ) : (
        <Input id={id} {...props} />
      )}
    </div>
  );
}
