import type { getEmergencyReserveComposition } from "@/lib/server/investment-operations";

export type EmergencyReserveComposition = Awaited<ReturnType<typeof getEmergencyReserveComposition>>;
export type EmergencyReserveCompositionProps = { composition: EmergencyReserveComposition };
export type ReserveFigureProps = { label: string; value: number };
