export interface LoginPreviewProps {
  variant: "overview" | "planning" | "goals";
}

export interface LoginPreviewMoneyProps {
  value: string;
  cents: string;
  className?: string;
}
