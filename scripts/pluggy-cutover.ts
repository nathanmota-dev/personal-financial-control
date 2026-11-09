import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { createDatabase } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { PluggyClient } from "@/lib/server/pluggy/client";
import { parseCutoverArgs, runCutoverCli } from "@/lib/server/pluggy/cutover/cli";

async function writePrivateFile(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, content, { mode: 0o600 });
  await chmod(path, 0o600);
}

async function main() {
  const command = parseCutoverArgs(process.argv.slice(2));
  const env = getServerEnv();
  if (env.DEMO_MODE) throw new Error("The cutover does not run in demo mode.");
  if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) throw new Error("Explicit DATABASE_URL or TURSO_DATABASE_URL is required; the cutover never falls back to another database.");
  // Always the source connection: an active replica is owned by the running app.
  const db = createDatabase(env.DATABASE_URL, env.TOKEN);
  const { PLUGGY_CLIENT_ID: clientId, PLUGGY_CLIENT_SECRET: clientSecret } = env;
  const client = clientId && clientSecret ? new PluggyClient({ clientId, clientSecret }) : null;
  try {
    await runCutoverCli(command, {
      db,
      client,
      databaseUrl: env.DATABASE_URL,
      rootDirectory: process.cwd(),
      io: { log: console.log, readFile: (path) => readFile(path, "utf8"), writeFile: writePrivateFile },
    });
  } finally {
    db.$client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "The cutover failed.");
  process.exitCode = 1;
});
