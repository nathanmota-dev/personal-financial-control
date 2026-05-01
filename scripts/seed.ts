import { getDatabase } from "@/lib/db";
import { createAccount } from "@/lib/server/accounts";
import { createCategory, listCategories } from "@/lib/server/categories";

const defaultCategories = [
  { name: "Salary", group: "income" as const },
  { name: "Housing", group: "fixed_expense" as const },
  { name: "Utilities", group: "fixed_expense" as const },
  { name: "Food", group: "variable_expense" as const },
  { name: "Transport", group: "variable_expense" as const },
  { name: "Brokerage Contribution", group: "investment" as const },
];

async function main() {
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
