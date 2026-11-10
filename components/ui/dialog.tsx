"use client"

import { Dialog as DialogPrimitive } from "radix-ui"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { toneClass } from "@/lib/finance-tone"
import type { Tone } from "@/lib/interfaces/design-system"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-overlay/45 duration-150 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 max-h-[calc(100dvh-2rem)] overflow-y-auto gap-6 rounded-[24px] border border-border bg-popover p-6 text-sm text-popover-foreground shadow-2xl duration-150 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-4 right-4 z-10 rounded-full bg-muted/60 text-content hover:bg-muted"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Fechar</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  icon,
  tone = "brand",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode
  tone?: Tone
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "relative -mx-6 -mt-6 flex items-start gap-3.5 border-b border-border bg-muted/40 px-6 pt-6 pb-5 pr-14 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-hero",
        className
      )}
      {...props}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            "tone-soft mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-[18px]",
            toneClass(tone)
          )}
        >
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>
    </div>
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "sticky -bottom-6 z-10 -mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-border bg-popover px-6 py-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Fechar</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-tight font-semibold tracking-[-0.2px]", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-[13px] leading-5 text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
Dialog,
DialogClose,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogOverlay,
DialogPortal,
DialogTitle,
DialogTrigger
}
