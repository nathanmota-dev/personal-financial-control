import { customType } from "drizzle-orm/sqlite-core";

import { decryptMoney, encryptMoney } from "@/lib/crypto/money";

export function encryptedMoneyColumn(name: string, context: string) {
  return customType<{ data: number; driverData: string }>({
    dataType: () => "text",
    toDriver: (value) => encryptMoney(value, context),
    fromDriver: (value) => decryptMoney(value, context),
  })(name);
}
