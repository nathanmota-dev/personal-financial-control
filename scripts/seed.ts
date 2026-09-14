import { defaultCategories } from "@/lib/category-defaults";
import { getDatabase } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { createAccount } from "@/lib/server/accounts";
import { createCategory, listCategories } from "@/lib/server/categories";

async function main() {
  if (getServerEnv().DEMO_MODE) {
    console.log("Demo mode already provides its in-memory fixture; seed skipped.");
    return;
  }

  const db = getDatabase();
  const existing = await listCategories({ includeArchived: true }, db);
  const existingNames = new Set(existing.map((category) => category.name));

  for (const category of defaultCategories) {
    if (!existingNames.has(category.name)) {
      await createCategory(category, db);
    }
  }

  if (process.argv.includes("--with-accounts")) {
    await createAccount(
      {
        name: "Main Checking",
        type: "checking",
        initialBalanceCents: 0,
      },
      db
    );
    await createAccount(
      {
        name: "Brokerage",
        type: "investment",
        initialBalanceCents: 0,
      },
      db
    );
  }

  console.log("Seed completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
