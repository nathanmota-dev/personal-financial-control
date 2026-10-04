import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3100",
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // Exercise the real login UI and its missing-configuration error in isolation.
      DEMO_MODE: "false",
      APP_URL: baseURL,
      DATABASE_URL: "file:./.tmp/e2e.db",
      DATA_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"),
      NEXT_PUBLIC_FIREBASE_API_KEY: "",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
      NEXT_PUBLIC_FIREBASE_APP_ID: "",
      FIREBASE_PROJECT_ID: "",
      FIREBASE_CLIENT_EMAIL: "",
      FIREBASE_PRIVATE_KEY: "",
    },
  },
});
