/** Where the reserve projection takes its monthly contribution from. */
export type ReserveContributionPlan = {
  /** `custom` is the amount the user saved; `recurring` sums the reserve category's active recurring entries. */
  source: "custom" | "recurring";
  monthlyCents: number;
  recurringMonthlyCents: number;
  /** A category matching "Reserva de emergência" exists; without it nothing is planned for the reserve. */
  hasReserveCategory: boolean;
};

export type SetReserveContributionInput = { monthlyContributionCents: number | null };
