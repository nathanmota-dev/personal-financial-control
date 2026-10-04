import * as React from "react";

export interface SidebarDiv2Props {
  state: "expanded" | "collapsed";
  collapsible: "none" | "offcanvas" | "icon";
  variant: "sidebar" | "floating" | "inset";
  side: "left" | "right";
  className: string | undefined;
  props: React.ComponentProps<"div">;
  children: React.ReactNode;
}
