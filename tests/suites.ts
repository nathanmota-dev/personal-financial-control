// Presentation, browser authentication and UI helper tests belong to the frontend.
// The backend suite takes every remaining unit test, including future additions.
export const frontendTests = [
  "tests/auth-client.test.ts",
  "tests/auth-login-errors.test.ts",
  "tests/category-spending.test.ts",
  "tests/finance-ui.test.ts",
  "tests/money-input.test.ts",
  "tests/projected-balance-calendar.test.ts",
  "tests/recurring-calendar.test.ts",
  "tests/theme-script.test.ts",
  "tests/transaction-navigation.test.ts",
  "tests/transaction-reduction.test.ts",
];
