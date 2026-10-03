import type { LucideIcon } from "lucide-react";

export type HelpStep = {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
};

export type HelpGuide = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type HelpQuestion = {
  question: string;
  answer: string;
};
