"use client"
import { cn } from "@/lib/utils"
import { createContext, useContext, useCallback, useMemo } from "react"
import { useControllableState } from "@radix-ui/react-use-controllable-state"
import type * as React from "react"
import type { ChoiceGroupContextValue, ChoiceGroupProps, ChoiceGroupItemProps } from "./contracts"
const ChoiceGroupContext = createContext<ChoiceGroupContextValue | null>(null)
function useChoiceGroup() {
  const ctx = useContext(ChoiceGroupContext)
  if (!ctx) {
    throw new Error("ChoiceGroup.Item must be used within ChoiceGroup")
  }
  return ctx
}
function ChoiceGroupRoot({
  value: controlledValue,
  defaultValue = null,
  onValueChange,
  name,
  orientation = "grid",
  children,
  className,
  ...props
}: ChoiceGroupProps) {
  const [value, setValueState] = useControllableState({
    prop: controlledValue ?? undefined,
    defaultProp: defaultValue ?? null,
    onChange: (v) => v !== null && onValueChange?.(v),
  })
  const setValue = useCallback(
    (v: string) => {
      setValueState(v)
    },
    [setValueState]
  )
  const contextValue = useMemo<ChoiceGroupContextValue>(
    () => ({
      value,
      setValue,
      name,
      orientation,
    }),
    [value, setValue, name, orientation]
  )
  return (
    <ChoiceGroupContext.Provider value={contextValue}>
      <div
        aria-label={name}
        className={cn(className)}
        data-orientation={orientation}
        data-slot="choice-group"
        role="radiogroup"
        {...props}
      >
        {children}
      </div>
    </ChoiceGroupContext.Provider>
  )
}
function ChoiceGroupItemComponent({
  value: itemValue,
  children,
  className,
  ...props
}: ChoiceGroupItemProps) {
  const { value, setValue, name } = useChoiceGroup()
  const isSelected = value === itemValue
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.currentTarget.checked) {
        setValue(itemValue)
      }
    },
    [itemValue, setValue]
  )
  return (
    <label
      className={cn(className)}
      data-slot="choice-group-item"
      data-state={isSelected ? "selected" : "unselected"}
      {...props}
    >
      <input
        checked={isSelected}
        className="sr-only"
        name={name}
        onChange={handleChange}
        type="radio"
        value={itemValue}
      />
      {children}
    </label>
  )
}
ChoiceGroupItemComponent.displayName = "ChoiceGroupItem"
export const ChoiceGroup = Object.assign(ChoiceGroupRoot, {
  Item: ChoiceGroupItemComponent,
})
