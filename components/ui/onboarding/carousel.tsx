"use client"
import { cn } from "@/lib/utils"
import { createContext, useContext, useCallback, useMemo, Children } from "react"
import { useControllableState } from "@radix-ui/react-use-controllable-state"
import type * as React from "react"
import type { FeatureCarouselContextValue, FeatureCarouselProps, FeatureCarouselItemProps } from "./contracts"
const FeatureCarouselContext =
  createContext<FeatureCarouselContextValue | null>(null)
function useFeatureCarousel() {
  const ctx = useContext(FeatureCarouselContext)
  if (!ctx) {
    throw new Error("FeatureCarousel.Item must be used within FeatureCarousel")
  }
  return ctx
}
function FeatureCarouselRoot({
  value: controlledValue,
  defaultValue = 0,
  onValueChange,
  totalItems: totalItemsProp,
  children,
  className,
  ...props
}: FeatureCarouselProps) {
  const [value, setValue] = useControllableState({
    prop: controlledValue,
    defaultProp: defaultValue,
    onChange: onValueChange,
  })
  const totalItems = totalItemsProp ?? Children.count(children)
  const isActive = useCallback((index: number) => value === index, [value])
  const contextValue = useMemo<FeatureCarouselContextValue>(
    () => ({
      value,
      setValue,
      totalItems,
      isActive,
    }),
    [value, setValue, totalItems, isActive]
  )
  return (
    <FeatureCarouselContext.Provider value={contextValue}>
      <div
        aria-label="Features"
        className={cn(className)}
        data-slot="feature-carousel"
        role="tablist"
        {...props}
      >
        {children}
      </div>
    </FeatureCarouselContext.Provider>
  )
}
function FeatureCarouselItemComponent({
  index,
  children,
  className,
  onClick,
  ...props
}: FeatureCarouselItemProps) {
  const { setValue, isActive, totalItems } = useFeatureCarousel()
  const active = isActive(index)
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setValue(index)
      onClick?.(e)
    },
    [index, setValue, onClick]
  )
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (totalItems <= 1) {
        return
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        setValue((prev) => Math.min(prev + 1, totalItems - 1))
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        setValue((prev) => Math.max(prev - 1, 0))
      }
    },
    [totalItems, setValue]
  )
  return (
    <button
      aria-selected={active}
      className={cn(className)}
      data-slot="feature-carousel-item"
      data-state={active ? "active" : "inactive"}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="tab"
      tabIndex={active ? 0 : -1}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
FeatureCarouselItemComponent.displayName = "FeatureCarouselItem"
export const FeatureCarousel = Object.assign(FeatureCarouselRoot, {
  Item: FeatureCarouselItemComponent,
})
