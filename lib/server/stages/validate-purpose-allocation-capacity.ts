import {
investmentPurposeAllocations,
investmentPurposes
} from "@/lib/db/schema";
import type { ValidatePurposeAllocationCapacityContext } from "@/lib/interfaces/stages/validate-purpose-allocation-capacity";
import { invariant } from "@/lib/server/errors";
import { eq,inArray } from "drizzle-orm";

export async function validatePurposeAllocationCapacity({ transaction, holding, existing, purpose, values }: ValidatePurposeAllocationCapacityContext) {
const holdingAllocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.holdingId, holding.id),
    });

const allocatedElsewhereCents = holdingAllocations
      .filter((allocation) => allocation.id !== existing?.id)
      .reduce((total, allocation) => total + allocation.amountCents, 0);

const purposeIds = holdingAllocations.map((allocation) => allocation.purposeId);

const linkedPurposes = purposeIds.length
      ? await transaction.query.investmentPurposes.findMany({
          where: inArray(investmentPurposes.id, purposeIds),
        })
      : [];

const linkedToReserve = linkedPurposes.some(
      (linkedPurpose) => linkedPurpose.kind === "emergency_reserve"
    );

invariant(
      purpose.kind !== "emergency_reserve" || allocatedElsewhereCents === 0,
      "RESERVE_HOLDING_MUST_BE_DEDICATED",
      "O ativo da reserva não pode compartilhar outras finalidades."
    );

invariant(
      purpose.kind === "emergency_reserve" || !linkedToReserve,
      "RESERVE_HOLDING_MUST_BE_DEDICATED",
      "O ativo da reserva não pode compartilhar outras finalidades."
    );

invariant(
      purpose.kind !== "emergency_reserve" || values.amountCents === holding.currentValueCents,
      "RESERVE_ALLOCATION_MUST_MATCH_BALANCE",
      "A reserva deve receber 100% do saldo do ativo dedicado."
    );

invariant(
      allocatedElsewhereCents + values.amountCents <= holding.currentValueCents,
      "ALLOCATION_EXCEEDS_HOLDING_VALUE",
      "The allocation cannot exceed the current value of the holding."
    );

}
