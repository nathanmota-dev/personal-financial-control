import * as React from "react";

export interface SidebarSheet1Props {
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  props: React.ComponentProps<"div">;
  dir: string | undefined;
  side: "left" | "right";
  children: React.ReactNode;
}
