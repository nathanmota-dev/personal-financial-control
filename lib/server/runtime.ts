import { DEMO_REFERENCE_DATE } from "@/lib/demo/constants";
import { getServerEnv } from "@/lib/env";

export function getFinanceToday() {
  return getServerEnv().DEMO_MODE
    ? DEMO_REFERENCE_DATE
    : new Date().toISOString().slice(0, 10);
}

export function getFinanceDefaultMonth() {
  return getFinanceToday().slice(0, 7);
}
