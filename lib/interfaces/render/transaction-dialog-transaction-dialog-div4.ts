
export interface TransactionDialogDiv4Props {
  formId: string;
  selectedType: "income" | "expense" | "investment_contribution" | "investment_withdrawal";
  handleTypeChange: (value: string) => void;
}
