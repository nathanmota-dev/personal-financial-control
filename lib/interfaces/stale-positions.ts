/** A followed bank position whose value the bank stopped updating: usually an application already redeemed. */
export type StalePosition = {
  id: string;
  name: string;
  currentValueCents: number;
  valueAsOf: string;
};

export type RetireStalePositionInput = { holdingId: string };
