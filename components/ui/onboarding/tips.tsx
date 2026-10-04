"use client"
import { cn } from "@/lib/utils"
import { useId } from "react"
import type { TipsListProps, TipsListItemProps } from "./contracts"
function TipsListRoot({ title, children, className, ...props }: TipsListProps) {
  const titleId = useId()
  return (
    <div className={cn(className)} data-slot="tips-list" {...props}>
      {title && (
        <p className="sr-only" data-slot="tips-list-title" id={titleId}>
          {title}
        </p>
      )}
      <ol
        aria-label={title ? undefined : "Tips"}
        aria-labelledby={title ? titleId : undefined}
        data-slot="tips-list-items"
      >
        {children}
      </ol>
    </div>
  )
}
function TipsListItemComponent({
  number,
  children,
  className,
  ...props
}: TipsListItemProps) {
  return (
    <li
      className={cn(className)}
      data-number={number}
      data-slot="tips-list-item"
      {...props}
    >
      {number != null && (
        <span aria-hidden data-slot="tips-list-item-number">
          {number}
        </span>
      )}
      {children}
    </li>
  )
}
export const TipsList = Object.assign(TipsListRoot, {
  Item: TipsListItemComponent,
})
