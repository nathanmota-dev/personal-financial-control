// Runs in the production server process. Only brapi traffic is simulated;
// browser requests, Server Actions, HTTP routes and SQLite remain real.
import { readFileSync } from "node:fs";
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (input, init) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (new URL(url).hostname !== "brapi.dev") return originalFetch(input, init);
  const control = JSON.parse(
    readFileSync(process.env.BRAPI_E2E_CONTROL, "utf8"),
  );
  const symbol = decodeURIComponent(new URL(url).pathname.split("/").pop());
  return new Response(
    JSON.stringify(
      control.invalid
        ? { results: [] }
        : {
            results: [
              {
                symbol,
                currency: "BRL",
                regularMarketPrice: control.price ?? 42.5,
                regularMarketTime: "2026-07-16T12:00:00Z",
                marketState: "REGULAR",
              },
            ],
          },
    ),
    {
      status: control.status ?? 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
