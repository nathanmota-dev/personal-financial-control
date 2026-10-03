import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import type { FinanceServer } from "./contracts";

export async function startFinanceServer(): Promise<FinanceServer> {
  const root = process.cwd();
  const standalone = path.join(root, ".next/standalone");
  const directory = await mkdtemp(path.join(tmpdir(), "pfc-e2e-"));
  const url = "http://localhost:3101";
  let output = "";
  try {
    await cp(
      path.join(root, ".next/static"),
      path.join(standalone, ".next/static"),
      { recursive: true },
    );
    await cp(
      path.join(standalone, "server.js"),
      path.join(directory, "server.js"),
    );
    await cp(
      path.join(standalone, "package.json"),
      path.join(directory, "package.json"),
    );
    for (const [source, name] of [
      [path.join(standalone, "node_modules"), "node_modules"],
      [path.join(standalone, ".next"), ".next"],
      [path.join(root, "drizzle"), "drizzle"],
      [path.join(root, "public"), "public"],
    ]) {
      await symlink(source, path.join(directory, name), "dir");
    }
    await mkdir(path.join(directory, "tmp"));
    const control = path.join(directory, "brapi.json");
    await writeFile(control, "{}");
    const child = spawn(
      process.execPath,
      ["--import", path.join(root, "tests/e2e/helpers/brapi.mjs"), "server.js"],
      {
        cwd: directory,
        env: {
          ...process.env,
          NODE_ENV: "production",
          DEMO_MODE: "true",
          APP_URL: url,
          PORT: "3101",
          HOSTNAME: "127.0.0.1",
          TMPDIR: path.join(directory, "tmp"),
          DATABASE_URL: `file:${path.join(directory, "finance.db")}`,
          TOKEN: "e2e-unused-token",
          DATA_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString("base64"),
          BRAPI_API_TOKEN: "e2e-test-token",
          BRAPI_E2E_CONTROL: control,
          INVESTMENT_QUOTE_MIN_INTERVAL_MINUTES: "0",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    child.stdout.on("data", (data) => {
      output = (output + data.toString()).slice(-200000);
    });
    child.stderr.on("data", (data) => {
      output = (output + data.toString()).slice(-200000);
    });
    let spawnError: Error | undefined;
    child.on("error", (error) => {
      spawnError = error;
    });
    const close = async () => {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = once(child, "exit");
        child.kill("SIGTERM");
        const timer = setTimeout(() => child.kill("SIGKILL"), 5000);
        try {
          await exited;
        } finally {
          clearTimeout(timer);
        }
      }
      await rm(directory, { recursive: true, force: true });
    };
    try {
      const deadline = Date.now() + 45000;
      while (Date.now() < deadline) {
        if (spawnError || child.exitCode !== null)
          throw spawnError ?? new Error(`Finance server exited: ${output}`);
        try {
          const response = await fetch(`${url}/api/accounts`, {
            signal: AbortSignal.timeout(1500),
          });
          if (response.ok && (await response.json()).accounts.length === 5)
            return {
              url,
              directory,
              logs: () => output,
              market: async (response) => {
                await writeFile(control, JSON.stringify(response));
              },
              close,
            };
        } catch {
          /* Poll readiness of the actual database-backed route. */
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error(`Finance server was not ready: ${output}`);
    } catch (error) {
      await close();
      throw error;
    }
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}
