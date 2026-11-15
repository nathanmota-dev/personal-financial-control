import type { MouseEventHandler } from "react";

export interface BackButtonProps {
  href: string;
  label?: string;
  /** Runs before navigation; call `preventDefault` to go back in history instead of following `href`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}
