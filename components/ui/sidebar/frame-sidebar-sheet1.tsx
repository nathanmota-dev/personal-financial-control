"use client";

import {
Sheet,
SheetContent,
SheetDescription,
SheetHeader,
SheetTitle,
} from "@/components/ui/sheet";
import { SIDEBAR_WIDTH_MOBILE } from "@/components/ui/sidebar/context";
import type { SidebarSheet1Props } from "@/lib/interfaces/render/frame-sidebar-sheet1";
import * as React from "react";

export function SidebarSheet1({ openMobile, setOpenMobile, props, dir, side, children }: SidebarSheet1Props) {
  return (
<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
  );
}
