"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { useSidebar } from "./context";
import { SidebarDiv2 } from "./frame-sidebar-div2";
import { SidebarSheet1 } from "./frame-sidebar-sheet1";

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <SidebarSheet1 openMobile={openMobile} setOpenMobile={setOpenMobile} props={props} dir={dir} side={side} >{children}</SidebarSheet1>
    )
  }

  return (
    <SidebarDiv2 state={state} collapsible={collapsible} variant={variant} side={side} className={className} props={props} >{children}</SidebarDiv2>
  )
}
