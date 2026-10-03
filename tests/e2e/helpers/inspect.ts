import { startFinanceServer } from "./server";

async function inspect() {
  const server = await startFinanceServer();
  console.log(
    `Finance demo: ${server.url}\nReference: 2026-07-16. Disposable data: ${server.directory}\nPress Ctrl+C to stop and remove data.`,
  );
  await new Promise<void>((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
  await server.close();
}
inspect().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
